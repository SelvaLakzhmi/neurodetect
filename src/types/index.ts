export interface Scan {
    id: string;
    date: string;
    predictedClass: "Alzheimer's" | "MCI" | "Normal";
    probability: number;
    riskLevel: "Low" | "Medium" | "High";
}

export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: "male" | "female" | "other";
    familyHistory: boolean;
    phone?: string;
    email?: string;
    scans: Scan[];
}
