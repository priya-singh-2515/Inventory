export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (New)" },
  { code: "38", name: "Ladakh" }
];

export const VALID_GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];

export const UNITS = [
  "BAG-BAGS",
  "BAL-BALE",
  "BDL-BUNDLES",
  "BKL-BUCKLES",
  "BOU-BILLION OF UNITS",
  "BOX-BOX",
  "BTL-BOTTLES",
  "BUN-BUNCHES",
  "CAN-CANS",
  "CBM-CUBIC METERS",
  "CCM-CUBIC CENTIMETERS",
  "CMS-CENTIMETERS",
  "DOZ-DOZENS",
  "DRM-DRUMS",
  "GGK-GREAT GROSS",
  "GMS-GRAMMES",
  "GRS-GROSS",
  "GYD-GROSS YARDS",
  "KGS-KILOGRAMS",
  "KLR-KILOLITRE",
  "KME-KILOMETRE",
  "MLT-MILLILITRE",
  "MTR-METERS",
  "NOS-NUMBERS",
  "PAC-PACKS",
  "PCS-PIECES",
  "PRS-PAIRS",
  "QTL-QUINTAL",
  "SET-SETS",
  "SQF-SQUARE FEET",
  "SQM-SQUARE METERS",
  "SQY-SQUARE YARDS",
  "TBS-TABLETS",
  "TGM-TEN GROSS",
  "THD-THOUSANDS",
  "TON-TONNES",
  "TUB-TUBES",
  "UGS-US GALLONS",
  "UNT-UNITS",
  "YDS-YARDS",
  "OTH-OTHERS"
];

export const GST_REG_TYPES = [
  "Regular",
  "Composition",
  "Unregistered",
  "Consumer",
  "SEZ Unit",
  "SEZ Developer",
  "Overseas"
];

export const STOCK_ADJUSTMENT_REASONS = [
  "Physical Count Variance",
  "Damaged Goods",
  "Expired Stock",
  "Opening Stock Setup",
  "Sample Distribution",
  "Other"
] as const;

export const ITC_ELIGIBILITY_OPTIONS = [
  "Inputs",
  "Capital Goods",
  "Input Services",
  "Ineligible"
] as const;

export const PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Cheque", "Credit Card"];
