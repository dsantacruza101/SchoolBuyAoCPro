import { FirebaseOptions } from '@angular/fire/app';
import { environment } from '../../../environments/environment';

/**
 * Firebase app configuration object, sourced from the Angular environment file.
 * Swapped automatically between `environment.ts` (production) and
 * `environment.development.ts` (dev) by the Angular CLI file-replacement system.
 */
export const firebaseConfig: FirebaseOptions = environment.firebase;
