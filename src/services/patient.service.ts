import { Patient, Scan } from "@/types";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export const patientStore = {
    getPatients: async (): Promise<Patient[]> => {
        try {
            const querySnapshot = await getDocs(collection(db, "patients"));
            // Return sorted by creation theoretically, but here just mapped
            return querySnapshot.docs.map(doc => doc.data() as Patient);
        } catch (error) {
            console.error("Error fetching patients:", error);
            return [];
        }
    },

    getPatientById: async (id: string): Promise<Patient | undefined> => {
        try {
            const docRef = doc(db, "patients", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as Patient;
            }
            return undefined;
        } catch (error) {
            console.error("Error fetching patient", id, error);
            return undefined;
        }
    },

    addPatient: async (patientData: Omit<Patient, "id" | "scans">): Promise<Patient> => {
        // Generate a simple mock ID (in full production you would use Firestore auto-ids or UUIDs)
        const newId = `PT-${Math.floor(100 + Math.random() * 900)}`;
        const newPatient: Patient = {
            ...patientData,
            id: newId,
            scans: [],
        };
        try {
            await setDoc(doc(db, "patients", newId), newPatient);
            return newPatient;
        } catch (error) {
            console.error("Error adding patient:", error);
            throw error;
        }
    },

    updatePatient: async (id: string, patientData: Omit<Patient, "id" | "scans">): Promise<void> => {
        try {
            const docRef = doc(db, "patients", id);
            await updateDoc(docRef, {
                ...patientData
            });
        } catch (error) {
            console.error("Error updating patient:", error);
            throw error;
        }
    },

    addScanToPatient: async (patientId: string, scanData: Omit<Scan, "id">): Promise<Scan | null> => {
        const newScanId = `SCN-${Math.floor(100 + Math.random() * 900)}`;
        const newScan: Scan = {
            ...scanData,
            id: newScanId,
        };

        try {
            const docRef = doc(db, "patients", patientId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) return null;

            const patient = docSnap.data() as Patient;
            // Add scan to the beginning of the array so newest is first
            const updatedScans = [newScan, ...(patient.scans || [])];

            await updateDoc(docRef, { scans: updatedScans });
            return newScan;
        } catch (error) {
            console.error("Error adding scan to patient:", error);
            return null;
        }
    },

    deletePatient: async (id: string): Promise<boolean> => {
        try {
            await deleteDoc(doc(db, "patients", id));
            return true;
        } catch (error) {
            console.error("Error deleting patient:", error);
            return false;
        }
    },

    /**
     * Sends an email via the custom Next.js Nodemailer route configured with UI settings.
     */
    sendAutomatedEmail: async (
        toEmail: string,
        patientName: string,
        subject: string,
        htmlContent: string,
        senderEmail: string,
        senderPassword: string
    ): Promise<boolean> => {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    toEmail,
                    patientName,
                    subject,
                    htmlContent,
                    senderEmail,
                    senderPassword
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Email Error payload:", errorData);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error firing automated email request:", error);
            return false;
        }
    }
};
