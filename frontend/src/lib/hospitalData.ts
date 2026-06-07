export type Hospital = {
  id: string;
  name: string;
  city: string;
  coords: [number, number];
  rating: number;
  specialization: string;
  recommended: boolean;
  description: string;
  contactPhone?: string;
  address?: string;
  beds?: number;
  acreDays?: number;
};

export const HOSPITALS: Hospital[] = [
  {
    id: "tata-memorial-mumbai",
    name: "Tata Memorial Hospital",
    city: "Mumbai",
    coords: [19.0048, 72.8426],
    rating: 4.8,
    specialization: "Cancer Treatment",
    recommended: true,
    description: "A nationally recognized tertiary cancer center with multidisciplinary tumor boards, advanced surgical oncology, precision radiotherapy, and robust clinical trial access for complex cancer cases.",
    contactPhone: "+91-22-2417-7000",
    address: "Dr. E. Borges Road, Parel, Mumbai",
    beds: 650,
    acreDays: 95,
  },
  {
    id: "apollo-cancer-mumbai",
    name: "Apollo Cancer Centre",
    city: "Mumbai",
    coords: [19.0176, 72.8562],
    rating: 4.6,
    specialization: "Oncology",
    recommended: true,
    description: "Comprehensive oncology facility providing medical, surgical, and radiation oncology with integrated diagnostics, chemo day-care services, and coordinated survivorship programs.",
    contactPhone: "+91-22-6789-0000",
    address: "Navi Mumbai, Mumbai",
    beds: 250,
    acreDays: 92,
  },
  {
    id: "fortis-hospital-mumbai",
    name: "Fortis Hospital",
    city: "Mumbai",
    coords: [19.0596, 72.8295],
    rating: 4.5,
    specialization: "Multi-specialty",
    recommended: false,
    description: "A large multi-specialty hospital with oncology support units, critical care, and broad specialist availability for patients needing coordinated non-cancer and cancer-adjacent care.",
    contactPhone: "+91-22-2407-2222",
    address: "101 Cecil Road, Byculla, Mumbai",
    beds: 550,
    acreDays: 88,
  },
  {
    id: "aiims-delhi",
    name: "AIIMS Delhi",
    city: "Delhi",
    coords: [28.5672, 77.2100],
    rating: 4.7,
    specialization: "Cancer & Research",
    recommended: true,
    description: "Premier academic institute offering specialized cancer diagnostics and treatment pathways, translational research programs, and access to high-complexity oncology expertise.",
    contactPhone: "+91-11-2658-8500",
    address: "Ansari Nagar, New Delhi",
    beds: 1800,
    acreDays: 96,
  },
  {
    id: "max-saket-delhi",
    name: "Max Healthcare - Saket",
    city: "Delhi",
    coords: [28.5265, 77.1963],
    rating: 4.6,
    specialization: "Oncology & Chemotherapy",
    recommended: true,
    description: "Dedicated oncology unit with systemic therapy protocols, infusion suites, image-guided interventions, and supportive care for side-effect management and recovery.",
    contactPhone: "+91-11-4141-1111",
    address: "Saket, New Delhi",
    beds: 350,
    acreDays: 91,
  },
  {
    id: "fortis-bangalore",
    name: "Fortis Hospital - Bangalore",
    city: "Bangalore",
    coords: [12.9716, 77.5946],
    rating: 4.5,
    specialization: "Cancer Center",
    recommended: false,
    description: "Regional cancer center delivering core oncology services including diagnostics, surgery support, radiation planning, and coordinated post-treatment follow-up.",
    contactPhone: "+91-80-4152-4152",
    address: "Bannerghatta Road, Bangalore",
    beds: 520,
    acreDays: 89,
  },
  {
    id: "healthcity-hyderabad",
    name: "HealthCity Hyderabad",
    city: "Hyderabad",
    coords: [17.3850, 78.4867],
    rating: 4.4,
    specialization: "Comprehensive Cancer Care",
    recommended: false,
    description: "Integrated cancer hospital focused on end-to-end care: screening, diagnosis, active treatment, palliative coordination, and long-term survivorship support.",
    contactPhone: "+91-40-6666-2222",
    address: "Gachibowli, Hyderabad",
    beds: 450,
    acreDays: 87,
  },
  {
    id: "regional-cancer-kolkata",
    name: "Regional Cancer Centre",
    city: "Kolkata",
    coords: [22.5726, 88.3639],
    rating: 4.5,
    specialization: "Oncology",
    recommended: false,
    description: "Established oncology institution with focused cancer care pathways, multidisciplinary consultation, and specialist referral networks across eastern India.",
    contactPhone: "+91-33-2440-7070",
    address: "AJC Bose Road, Kolkata",
    beds: 300,
    acreDays: 90,
  },
];

export const HOSPITAL_CATEGORIES = {
  oncology: ["Cancer Treatment", "Oncology", "Cancer & Research", "Oncology & Chemotherapy", "Cancer Center", "Comprehensive Cancer Care"],
  general: ["Multi-specialty"],
} as const;

export function isOncologyHospital(specialization: string): boolean {
  const oncologySpecs = ["Cancer Treatment", "Oncology", "Cancer & Research", "Oncology & Chemotherapy", "Cancer Center", "Comprehensive Cancer Care"];
  return oncologySpecs.includes(specialization);
}

export function getRecommendedHospitals(riskLevel?: "high" | "moderate" | "low"): Hospital[] {
  if (riskLevel === "high") {
    return [...HOSPITALS]
      .filter(h => isOncologyHospital(h.specialization))
      .sort((a, b) => b.rating - a.rating);
  }
  return [...HOSPITALS].sort((a, b) => b.rating - a.rating);
}

export function getHospitalsByCity(city: string): Hospital[] {
  return HOSPITALS.filter(h => h.city.toLowerCase() === city.toLowerCase());
}
