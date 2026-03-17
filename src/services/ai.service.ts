export interface PredictionResult {
    patientId: string
    date: string
    predictedClass: string
    riskLevel: "High" | "Medium" | "Low"
    probability: number
    confidence: number
    findings: string[]
    recommendation: string
}

/**
 * Mock AI Service for Alzheimer's Detection
 * 
 * NOTE: This service simulates the future integration with the Python FastAPI backend
 * running the Convolutional Neural Network (CNN) model.
 * 
 * Future Implementation:
 * This should be replaced with an actual Axios/Fetch call to the FastAPI endpoint:
 * 
 * ```typescript
 * import axios from 'axios';
 * 
 * export async function analyzeMRI(file: File): Promise<PredictionResult> {
 *    const formData = new FormData();
 *    formData.append('file', file);
 *    const response = await axios.post('http://localhost:8000/api/predict', formData, {
 *      headers: { 'Content-Type': 'multipart/form-data' }
 *    });
 *    return response.data;
 * }
 * ```
 */

import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export async function analyzeMRI(file: File | null): Promise<PredictionResult> {
    if (!file) {
        throw new Error("No MRI scan provided for analysis.")
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
        let apiUrl = "http://localhost:8000"

        // Dynamically fetch the current user's AI Service Endpoint configuration from Firestore
        if (auth.currentUser) {
            const settingsDoc = await getDoc(doc(db, "settings", auth.currentUser.uid))
            if (settingsDoc.exists() && settingsDoc.data().aiServiceUrl) {
                apiUrl = settingsDoc.data().aiServiceUrl
            }
        }

        const endpoint = `${apiUrl.replace(/\/$/, '')}/api/predict` // Ensure no trailing slash

        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data as PredictionResult
    } catch (error) {
        console.error("Error communicating with AI service:", error)
        throw new Error("Failed to analyze MRI scan. Ensure the Python backend is running and the Endpoint URL in your settings is correct.")
    }
}
