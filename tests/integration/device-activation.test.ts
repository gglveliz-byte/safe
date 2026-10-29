/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Pruebas de Integración y QA — Flujo E2E de Activación de Kits
 * ARCHIVO: tests/integration/device-activation.test.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Batería de pruebas de integración E2E automatizada contra Neon PostgreSQL para
 * el flujo completo de registro y activación de kits en SAFE:
 *
 * Flujo evaluado:
 *   1. Búsqueda y descifrado seguro AES-256-GCM del PIN confidencial de un kit
 *      virgen (SAFE-0002 de la tira de Cuenca).
 *   2. Guard anti-fuerza-bruta y rechazo de PIN incorrecto (HTTP 403).
 *   3. Despacho HTTP del endpoint canónico POST /api/devices/activate con
 *      esquema Zod strict, bcrypt coste 12, HMAC-SHA256 de IP y contactos JSONB.
 *   4. Validación de respuesta HTTP 201, descriptor de cookie HttpOnly y JWT.
 *   5. Aserción directa en Neon PostgreSQL de User (RIDER), MedicalProfile y
 *      transición de Device de UNCLAIMED a ACTIVE.
 *   6. Intento de re-activación del mismo chip: rechazo anti-carrera (HTTP 404).
 *   7. Purga y restauración atómica del estado operativo de la base de datos.
 *
 * SKILLS APLICADAS:
 *   - pruebas-verificacion-integracion (4 filtros DoD, mediciones de latencia).
 *   - safe-security-and-compliance (bcrypt coste 12, HMAC-SHA256 PII, cookies).
 *   - safe-zero-hardcoding-modularity (< 500 líneas, cero datos mock).
 * ==============================================================================
 */

import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import { POST } from "@/app/api/devices/activate/route";
import { db } from "@/lib/db";
import { decryptSecret, hmacSha256 } from "@/lib/crypto";
import { verifyToken } from "@/lib/auth-token";
import { getEnv } from "@/lib/env";

/** Código de dispositivo objetivo para la prueba de integración */
const TARGET_DEVICE_CODE = "SAFE-0002";

/** IP simulada del cliente para el cálculo de huella HMAC y rate limiting */
const MOCK_CLIENT_IP = "190.152.204.42";

/**
 * Función auxiliar para verificar condiciones booleanas con reporte claro.
 */
function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ FALLO DE ASERCIÓN: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

/**
 * Ejecutor principal de la prueba de integración E2E.
 */
async function runDeviceActivationTest(): Promise<void> {
  console.log("\n===============================================================================");
  console.log("🧪 SAFE QA: PRUEBA DE INTEGRACIÓN E2E — ACTIVACIÓN DE CASCO (POSTGRESQL NEON)");
  console.log("===============================================================================\n");

  const startTimeTotal = performance.now();
  let createdUserId: string | null = null;
  let testSucceeded = false;

  try {
    // --------------------------------------------------------------------------
    // PASO 1: Verificación de estado inicial y descifrado de PIN en PostgreSQL
    // --------------------------------------------------------------------------
    console.log(`[Paso 1/6] Inspeccionando estado inicial del kit ${TARGET_DEVICE_CODE}...`);
    const t0 = performance.now();
    const initialDevice = await db.device.findUnique({
      where: { code: TARGET_DEVICE_CODE },
      select: {
        id: true,
        code: true,
        status: true,
        userId: true,
        activationPinHash: true,
        activationPinEncrypted: true,
        batchName: true,
      },
    });

    assertCondition(initialDevice !== null, `El kit ${TARGET_DEVICE_CODE} existe en PostgreSQL Neon`);
    assertCondition(
      initialDevice?.status === "UNCLAIMED",
      `El kit ${TARGET_DEVICE_CODE} se encuentra en estado inicial UNCLAIMED`,
    );
    assertCondition(
      initialDevice?.userId === null,
      `El kit ${TARGET_DEVICE_CODE} no tiene usuario vinculado previamente (userId: null)`,
    );

    const decryptedPin = decryptSecret(initialDevice!.activationPinEncrypted);
    assertCondition(
      /^\d{6}$/.test(decryptedPin),
      `PIN confidencial descifrado correctamente con AES-256-GCM (${decryptedPin})`,
    );

    const isPinHashValid = await bcrypt.compare(decryptedPin, initialDevice!.activationPinHash);
    assertCondition(
      isPinHashValid,
      "El PIN descifrado coincide criptográficamente con el activationPinHash almacenado",
    );
    console.log(`  ⏱️ Tiempo Paso 1: ${(performance.now() - t0).toFixed(2)} ms\n`);

    // --------------------------------------------------------------------------
    // PASO 2: Prueba de seguridad — Rechazo de PIN inválido (HTTP 403)
    // --------------------------------------------------------------------------
    console.log("[Paso 2/6] Verificando protección contra PINs erróneos (HTTP 403)...");
    const tBadPin = performance.now();
    const badPinPayload = {
      code: TARGET_DEVICE_CODE,
      activationPin: "999999", // PIN incorrecto
      email: `bad.pin.${Date.now()}@safe.test`,
      password: "PasswordRobust2026!*",
      fullName: "Intruso No Autorizado",
      nationalId: "0102030405",
      photoUrl: "https://res.cloudinary.com/safe/image/upload/sample.jpg",
      bloodType: "O+",
      emergencyContacts: [
        {
          id: randomUUID(),
          name: "Contacto Prueba",
          relation: "Amigo",
          phone: "+593987654321",
          email: "contacto.prueba@safe.test",
        },
      ],
      termsAccepted: true,
      locale: "es",
    };

    const badPinReq = new Request("http://localhost:3000/api/devices/activate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": MOCK_CLIENT_IP,
      },
      body: JSON.stringify(badPinPayload),
    });

    const badPinRes = await POST(badPinReq);
    const badPinBody = await badPinRes.json();
    assertCondition(
      badPinRes.status === 403,
      `Respuesta HTTP esperada 403 para PIN incorrecto (Recibido: ${badPinRes.status})`,
    );
    assertCondition(
      badPinBody.error?.code === "FORBIDDEN",
      `Código de error canónico FORBIDDEN confirmado (${badPinBody.error?.message})`,
    );
    console.log(`  ⏱️ Tiempo Paso 2: ${(performance.now() - tBadPin).toFixed(2)} ms\n`);

    // --------------------------------------------------------------------------
    // PASO 3: Ejecución del flujo legítimo de registro y activación (HTTP 201)
    // --------------------------------------------------------------------------
    console.log("[Paso 3/6] Despachando activación legítima vía POST /api/devices/activate...");
    const tActivate = performance.now();
    const testTimestamp = Date.now();
    const testEmail = `qa.rider.${testTimestamp}@safe.test`;
    const plainPassword = "PasswordRobust2026!*";
    const contactUuid = randomUUID();

    const activationPayload = {
      code: TARGET_DEVICE_CODE,
      activationPin: decryptedPin,
      email: testEmail,
      password: plainPassword,
      fullName: "Santiago Alejandro Morales",
      nationalId: "1724567890",
      photoUrl: "https://res.cloudinary.com/dppv8ychs/image/upload/v1729800000/safe/riders/qa_sample.jpg",
      photoPublicId: "safe/riders/qa_sample",
      birthDate: "1994-06-15",
      bloodType: "O+",
      allergies: "Penicilina, Sulfamidas",
      chronicConditions: "Ninguna",
      medications: "Ninguna medicación continua",
      insuranceInfo: "Seguros Equinoccial Póliza #99482-A",
      emergencyNumber: "+593991122334",
      beneficiaryType: "SELF",
      country: "Ecuador",
      city: "Cuenca",
      residentialAddress: "Av. Remigio Crespo y Guayas 4-12",
      riderPhone: "+593984556677",
      age: 32,
      isOrganDonor: true,
      medicalFindings: "Sin cirugías previas ni implantes metálicos",
      hasGuardian: false,
      rescueNotes: "Retirar casco únicamente por personal paramédico certificado con collarín",
      frequentLocation: "Ruta Cuenca - Molleturo - Guayaquil",
      vehicleInfo: "Yamaha MT-09 2024 / Placa: AB-123C",
      emergencyContacts: [
        {
          id: contactUuid,
          name: "María Elena Morales",
          relation: "Hermana",
          phone: "+593998765432",
          email: "maria.morales@safe.test",
          isPrimary: true,
        },
      ],
      termsAccepted: true,
      locale: "es",
    };

    const activateReq = new Request("http://localhost:3000/api/devices/activate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": MOCK_CLIENT_IP,
      },
      body: JSON.stringify(activationPayload),
    });

    const activateRes = await POST(activateReq);
    const activateBody = await activateRes.json();

    assertCondition(
      activateRes.status === 201,
      `Respuesta HTTP esperada 201 CREATED (Recibido: ${activateRes.status})`,
    );
    assertCondition(
      activateBody.success === true,
      "Cuerpo de respuesta indica éxito de operación (success: true)",
    );
    assertCondition(
      activateBody.data?.redirect === "/dashboard",
      `Destino de redirección post-alta canónico: ${activateBody.data?.redirect}`,
    );
    assertCondition(
      activateBody.data?.deviceCode === TARGET_DEVICE_CODE,
      `Folio de dispositivo activado confirmado: ${activateBody.data?.deviceCode}`,
    );

    createdUserId = activateBody.data?.user?.id;
    assertCondition(
      typeof createdUserId === "string" && createdUserId.length > 0,
      `Usuario creado con UUID válido: ${createdUserId}`,
    );
    assertCondition(
      activateBody.data?.user?.email === testEmail,
      `Correo de usuario registrado coincide: ${activateBody.data?.user?.email}`,
    );
    assertCondition(
      activateBody.data?.user?.role === "RIDER",
      `Rol asignado al usuario es RIDER: ${activateBody.data?.user?.role}`,
    );

    // Validación de cookie de sesión y JWT
    const setCookieHeader = activateRes.headers.get("set-cookie");
    assertCondition(
      typeof setCookieHeader === "string" && setCookieHeader.includes("safe_session="),
      "Cabecera Set-Cookie emite la cookie canónica safe_session",
    );
    assertCondition(
      setCookieHeader!.includes("HttpOnly"),
      "La cookie safe_session incluye la bandera de seguridad HttpOnly",
    );
    assertCondition(
      setCookieHeader!.includes("SameSite=lax"),
      "La cookie safe_session incluye la política SameSite=lax",
    );

    const sessionMatch = setCookieHeader!.match(/safe_session=([^;]+)/);
    const jwtToken = sessionMatch ? sessionMatch[1] : null;
    assertCondition(jwtToken !== null, "Extracción de JWT compacto de la cookie exitosa");

    const verifiedPayload = await verifyToken(jwtToken!);
    assertCondition(verifiedPayload !== null, "JWT verificado criptográficamente con jose y JWT_SECRET");
    assertCondition(verifiedPayload?.sub === createdUserId, `Claim 'sub' del JWT coincide con el usuario (${verifiedPayload?.sub})`);
    assertCondition(verifiedPayload?.email === testEmail, `Claim 'email' del JWT coincide (${verifiedPayload?.email})`);
    assertCondition(verifiedPayload?.role === "RIDER", `Claim 'role' del JWT es RIDER (${verifiedPayload?.role})`);

    console.log(`  ⏱️ Tiempo Paso 3: ${(performance.now() - tActivate).toFixed(2)} ms\n`);

    // --------------------------------------------------------------------------
    // PASO 4: Aserciones directas en Neon PostgreSQL (Consistencia de Datos)
    // --------------------------------------------------------------------------
    console.log("[Paso 4/6] Verificando persistencia atómica en Neon PostgreSQL...");
    const tDbAssert = performance.now();

    // 1. Verificación en tabla User
    const userInDb = await db.user.findUnique({
      where: { id: createdUserId! },
    });
    assertCondition(userInDb !== null, "Registro User localizado en PostgreSQL");
    assertCondition(userInDb?.role === "RIDER", "Columna User.role es RIDER");
    assertCondition(userInDb?.isActive === true, "Columna User.isActive es true");
    assertCondition(
      Boolean(userInDb?.passwordHash.startsWith("$2a$12$") || userInDb?.passwordHash.startsWith("$2b$12$")),
      `Contraseña almacenada con hash bcrypt coste 12 (${userInDb?.passwordHash.substring(0, 10)}...)`,
    );
    const passwordMatches = await bcrypt.compare(plainPassword, userInDb!.passwordHash);
    assertCondition(passwordMatches, "Hash bcrypt valida satisfactoriamente contra la contraseña plana");

    // 2. Verificación en tabla MedicalProfile
    const profileInDb = await db.medicalProfile.findUnique({
      where: { userId: createdUserId! },
    });
    assertCondition(profileInDb !== null, "Registro MedicalProfile vinculado al usuario localizado en PostgreSQL");
    assertCondition(profileInDb?.fullName === activationPayload.fullName, `MedicalProfile.fullName coincide (${profileInDb?.fullName})`);
    assertCondition(profileInDb?.nationalId === activationPayload.nationalId, `MedicalProfile.nationalId coincide (${profileInDb?.nationalId})`);
    assertCondition(profileInDb?.bloodType === activationPayload.bloodType, `MedicalProfile.bloodType coincide (${profileInDb?.bloodType})`);
    assertCondition(profileInDb?.allergies === activationPayload.allergies, `MedicalProfile.allergies coincide (${profileInDb?.allergies})`);
    assertCondition(profileInDb?.isOrganDonor === true, "MedicalProfile.isOrganDonor es true");
    assertCondition(profileInDb?.consentVersion === getEnv().TERMS_VERSION, `Versión de términos registrada: ${profileInDb?.consentVersion}`);

    const expectedIpHash = hmacSha256(MOCK_CLIENT_IP);
    assertCondition(
      profileInDb?.consentIpHash === expectedIpHash,
      `Huella HMAC-SHA256 de IP coincide exactamente con la IP del cliente (${profileInDb?.consentIpHash})`,
    );

    // Verificación de contactos JSONB
    const contactsJson = profileInDb?.emergencyContacts as Array<{
      id: string;
      name: string;
      relation: string;
      phone: string;
      email: string;
      isPrimary?: boolean;
    }>;
    assertCondition(Array.isArray(contactsJson), "Columna emergencyContacts persistida como array JSON");
    assertCondition(contactsJson.length === 1, "Array emergencyContacts contiene exactamente 1 contacto");
    assertCondition(contactsJson[0]?.id === contactUuid, `UUID del contacto de emergencia intacto (${contactsJson[0]?.id})`);
    assertCondition(contactsJson[0]?.name === "María Elena Morales", `Nombre del contacto intacto (${contactsJson[0]?.name})`);
    assertCondition(contactsJson[0]?.isPrimary === true, "Marca isPrimary del contacto de emergencia intacta");

    // 3. Verificación en tabla Device
    const deviceInDb = await db.device.findUnique({
      where: { code: TARGET_DEVICE_CODE },
    });
    assertCondition(deviceInDb?.status === "ACTIVE", `Device.status transitó a ACTIVE (${deviceInDb?.status})`);
    assertCondition(deviceInDb?.userId === createdUserId, `Device.userId vinculado al usuario creado (${deviceInDb?.userId})`);
    assertCondition(deviceInDb?.activatedAt !== null, `Device.activatedAt sellado con marca temporal UTC (${deviceInDb?.activatedAt})`);

    console.log(`  ⏱️ Tiempo Paso 4: ${(performance.now() - tDbAssert).toFixed(2)} ms\n`);

    // --------------------------------------------------------------------------
    // PASO 5: Prueba anti-carrera / Re-activación del mismo chip (HTTP 404)
    // --------------------------------------------------------------------------
    console.log("[Paso 5/6] Verificando rechazo estricto de re-activación del mismo kit (HTTP 404)...");
    const tReattempt = performance.now();

    const reattemptReq = new Request("http://localhost:3000/api/devices/activate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": MOCK_CLIENT_IP,
      },
      body: JSON.stringify({
        ...activationPayload,
        email: `another.rider.${Date.now()}@safe.test`,
      }),
    });

    const reattemptRes = await POST(reattemptReq);
    const reattemptBody = await reattemptRes.json();

    assertCondition(
      reattemptRes.status === 404,
      `Respuesta HTTP esperada 404 NOT_FOUND para chip ya activo (Recibido: ${reattemptRes.status})`,
    );
    assertCondition(
      reattemptBody.error?.code === "NOT_FOUND",
      `Código de error canónico NOT_FOUND confirmado (${reattemptBody.error?.message})`,
    );
    console.log(`  ⏱️ Tiempo Paso 5: ${(performance.now() - tReattempt).toFixed(2)} ms\n`);

    testSucceeded = true;
  } finally {
    // --------------------------------------------------------------------------
    // PASO 6: Limpieza y restauración atómica del estado operativo normal
    // --------------------------------------------------------------------------
    console.log("[Paso 6/6] Restaurando base de datos Neon PostgreSQL al estado original...");
    const tCleanup = performance.now();

    // 1. Desvincular el kit y revertirlo a UNCLAIMED
    await db.device.update({
      where: { code: TARGET_DEVICE_CODE },
      data: {
        status: "UNCLAIMED",
        userId: null,
        activatedAt: null,
      },
    });

    // 2. Eliminar el usuario de prueba (cascada automática a MedicalProfile)
    if (createdUserId) {
      await db.user.delete({
        where: { id: createdUserId },
      });
    }

    // 3. Purgar buckets de rate limit de PIN creados durante la prueba
    await db.rateLimitBucket.deleteMany({
      where: {
        key: { startsWith: `pin:${TARGET_DEVICE_CODE}` },
      },
    });

    // 4. Verificación de limpieza
    const finalDevice = await db.device.findUnique({
      where: { code: TARGET_DEVICE_CODE },
    });
    assertCondition(
      finalDevice?.status === "UNCLAIMED" && finalDevice?.userId === null && finalDevice?.activatedAt === null,
      `Kit ${TARGET_DEVICE_CODE} restablecido a UNCLAIMED y liberado (userId: null)`,
    );

    if (createdUserId) {
      const remainingUser = await db.user.findUnique({ where: { id: createdUserId } });
      const remainingProfile = await db.medicalProfile.findFirst({ where: { userId: createdUserId } });
      assertCondition(remainingUser === null, "Usuario de prueba purgado completamente de PostgreSQL");
      assertCondition(remainingProfile === null, "Ficha médica purgada en cascada (cero huérfanos)");
    }

    console.log(`  ⏱️ Tiempo Paso 6: ${(performance.now() - tCleanup).toFixed(2)} ms\n`);
  }

  const durationTotal = (performance.now() - startTimeTotal).toFixed(2);
  console.log("===============================================================================");
  if (testSucceeded) {
    console.log(`🎉 PRUEBA DE INTEGRACIÓN COMPLETADA CON ÉXITO ABSOLUTO (PASS) — ${durationTotal} ms`);
  } else {
    console.log(`⚠️ LA PRUEBA FINALIZÓ CON ADVERTENCIAS — ${durationTotal} ms`);
  }
  console.log("===============================================================================\n");
}

// Ejecución directa de la suite
runDeviceActivationTest()
  .catch((error) => {
    console.error("\n💥 ERROR CRÍTICO EN PRUEBA DE INTEGRACIÓN:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(0);
  });
