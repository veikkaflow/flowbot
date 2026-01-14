import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logger } from "../utils/logger";

const db = admin.firestore();

// Create User Function
// Vain admin/superadmin käyttäjät voivat luoda uusia käyttäjiä
export async function handleCreateUser(
  data: { email: string; password: string; role: 'superadmin' | 'admin' | 'agent' | 'viewer'; name?: string },
  context: functions.https.CallableContext
) {
  // Tarkista että käyttäjä on autentikoitu
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Tarkista että kutsuva käyttäjä on admin tai superadmin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Caller user not found in database');
  }

  const callerData = callerDoc.data();
  const callerRole = callerData?.role;

  if (callerRole !== 'admin' && callerRole !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
  }

  // Tarkista että superadmin-roolia voi luoda vain superadmin
  if (data.role === 'superadmin' && callerRole !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Only superadmins can create superadmin users');
  }

  // Validoi salasana
  if (!data.password || data.password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long');
  }

  // Validoi sähköposti
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
  }

  try {
    // Luo käyttäjä Firebase Authiin
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name || data.email.split('@')[0],
      emailVerified: false,
    });

    // Luo käyttäjädokumentti Firestoreen
    await db.collection('users').doc(userRecord.uid).set({
      email: data.email,
      role: data.role,
      name: data.name || data.email.split('@')[0],
      allowedBotIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`User created successfully: ${data.email} (${data.role}) by ${callerData?.email}`);

    return {
      success: true,
      uid: userRecord.uid,
      email: data.email,
      role: data.role,
      name: data.name || data.email.split('@')[0],
    };
  } catch (error: any) {
    logger.error('Error creating user:', error);
    
    // Jos käyttäjä on jo olemassa, palauta selkeä virheilmoitus
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
    }
    
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create user');
  }
}


