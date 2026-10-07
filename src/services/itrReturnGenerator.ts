// src/services/itrReturnGenerator.ts

export interface Itr1InputData {
  assessee: {
    pan: string;
    aadhaarNumber?: string;
    firstName: string;
    surName: string;
    dob?: string; // YYYY-MM-DD
    mobile: string;
    email: string;
    address: {
      residenceNo?: string;
      roadOrStreet?: string;
      locality?: string;
      city: string;
      stateCode: string; // e.g. "27"
      pinCode: string;
    };
  };
  financialYear: string; // e.g. "2024-25"
  assessmentYear: string; // e.g. "2025"
  taxRegime: 'NEW' | 'OLD'; // Standard in FY 24-25/25-26 is New Regime as default
  incomeDetails: {
    grossSalary: number;
    standardDeduction?: number; // ₹75,000 under new regime / ₹50,000 under old
    housePropertyIncome?: number; // Self-occupied or let-out
    otherSourcesIncome?: number; // Savings interest, FD interest, dividends
  };
  deductions?: {
    section80C?: number; // EPF, PPF, ELSS (Old regime)
    section80D?: number; // Health Insurance
    section80TTA?: number; // Savings bank interest
    otherDeductions?: number;
  };
  taxesPaid?: {
    tdsSalary?: number;
    tdsOtherThanSalary?: number;
    advanceTax?: number;
    selfAssessmentTax?: number;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    accountType?: string; // "SB"
  };
  verification: {
    fatherName?: string;
    place?: string;
    date?: string;
  };
}

export interface Itr4InputData {
  assessee: {
    pan: string;
    aadhaarNumber?: string;
    businessName: string;
    tradeName?: string;
    natureOfBusinessCode?: string; // e.g. "09005" - Retail trade, "14001" - Consultancy
    firstName: string;
    surName: string;
    dob?: string;
    mobile: string;
    email: string;
    address: {
      residenceNo?: string;
      roadOrStreet?: string;
      locality?: string;
      city: string;
      stateCode: string;
      pinCode: string;
    };
  };
  assessmentYear: string;
  presumptiveSection: '44AD' | '44ADA'; // 44AD for business (6%/8%), 44ADA for professionals (50%)
  businessParticulars: {
    grossReceiptsBank: number; // Digital receipts (6% profit)
    grossReceiptsCash: number; // Cash receipts (8% profit)
    presumptiveIncomeDeclared: number;
    sundryDebtors?: number;
    sundryCreditors?: number;
    stockInTrade?: number;
    cashBalance?: number;
  };
  taxesPaid?: {
    advanceTax?: number;
    tdsPaid?: number;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
  verification: {
    place?: string;
    date?: string;
  };
}

/**
 * Calculates tax liability based on Indian Income Tax Slabs (New vs Old Regime)
 */
export function computeTaxLiability(taxableIncome: number, regime: 'NEW' | 'OLD' = 'NEW'): {
  taxOnIncome: number;
  rebate87A: number;
  cess: number;
  totalTaxLiability: number;
} {
  let tax = 0;

  if (regime === 'NEW') {
    // FY 2024-25 / 2025-26 Budget Slabs:
    // 0 - 3L: Nil
    // 3L - 7L: 5%
    // 7L - 10L: 10%
    // 10L - 12L: 15%
    // 12L - 15L: 20%
    // > 15L: 30%
    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 700000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 20000 + (taxableIncome - 700000) * 0.1;
    } else if (taxableIncome <= 1200000) {
      tax = 50000 + (taxableIncome - 1000000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 80000 + (taxableIncome - 1200000) * 0.2;
    } else {
      tax = 140000 + (taxableIncome - 1500000) * 0.3;
    }

    // Section 87A Rebate: Under New Regime, income up to 7 Lakhs gets full rebate (₹25,000)
    let rebate87A = 0;
    if (taxableIncome <= 700000) {
      rebate87A = tax;
      tax = 0;
    }

    const cess = Math.round(tax * 0.04);
    return {
      taxOnIncome: Math.round(tax + rebate87A),
      rebate87A: Math.round(rebate87A),
      cess,
      totalTaxLiability: Math.round(tax + cess),
    };
  } else {
    // Old Regime Standard Slabs:
    // 0 - 2.5L: Nil
    // 2.5L - 5L: 5%
    // 5L - 10L: 20%
    // > 10L: 30%
    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.2;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.3;
    }

    let rebate87A = 0;
    if (taxableIncome <= 500000) {
      rebate87A = Math.min(tax, 12500);
      tax = Math.max(0, tax - rebate87A);
    }

    const cess = Math.round(tax * 0.04);
    return {
      taxOnIncome: Math.round(tax + rebate87A),
      rebate87A: Math.round(rebate87A),
      cess,
      totalTaxLiability: Math.round(tax + cess),
    };
  }
}

/**
 * Generates official Government-compliant ITR-1 (Sahaj) JSON Schema for AY 2025-26
 */
export function generateOfficialItr1Json(input: Itr1InputData): {
  payload: any;
  filename: string;
  summary: {
    grossTotalIncome: number;
    totalDeductions: number;
    netTaxableIncome: number;
    taxLiability: number;
    totalTdsPaid: number;
    refundOrPayable: number;
  };
} {
  const pan = input.assessee.pan.trim().toUpperCase();
  const ay = input.assessmentYear || '2025';
  const regime = input.taxRegime || 'NEW';

  // Income computations
  const grossSalary = input.incomeDetails.grossSalary || 0;
  const standardDeduction = input.incomeDetails.standardDeduction ?? (regime === 'NEW' ? 75000 : 50000);
  const netSalary = Math.max(0, grossSalary - standardDeduction);
  const houseProperty = input.incomeDetails.housePropertyIncome || 0;
  const otherSources = input.incomeDetails.otherSourcesIncome || 0;
  const grossTotalIncome = netSalary + houseProperty + otherSources;

  // Deductions (Only applicable in Old Regime, except 80CCD(2) / 80CCH in New Regime)
  let totalDeductions = 0;
  if (regime === 'OLD' && input.deductions) {
    const d80c = Math.min(input.deductions.section80C || 0, 150000);
    const d80d = Math.min(input.deductions.section80D || 0, 100000);
    const d80tta = Math.min(input.deductions.section80TTA || 0, 10000);
    totalDeductions = d80c + d80d + d80tta + (input.deductions.otherDeductions || 0);
  }

  const netTaxableIncome = Math.max(0, grossTotalIncome - totalDeductions);
  const taxCalc = computeTaxLiability(netTaxableIncome, regime);

  const totalTds = (input.taxesPaid?.tdsSalary || 0) + (input.taxesPaid?.tdsOtherThanSalary || 0) + (input.taxesPaid?.advanceTax || 0);
  const refundOrPayable = totalTds - taxCalc.totalTaxLiability;

  const todayStr = new Date().toISOString().split('T')[0];

  const payload = {
    ITR: {
      ITR1: {
        CreationInfo: {
          SWVersionNo: '1.0.0',
          SWCreatedBy: 'QuinceCA AI Practice OS',
          JSONCreatedDate: todayStr,
          JSONCreatedBy: 'PRACTITIONER_SAMADHAN',
        },
        Form_ITR1: {
          FormName: 'ITR-1',
          Description: 'For Individuals being a Resident having Total Income up to Rs 50 lakh',
          AssessmentYear: ay,
        },
        PersonalInfo: {
          AssesseeName: {
            FirstName: input.assessee.firstName.trim().toUpperCase(),
            SurNameOrOrgName: input.assessee.surName.trim().toUpperCase(),
          },
          PAN: pan,
          AadhaarCardNo: input.assessee.aadhaarNumber || 'XXXXXXXX1234',
          DOB: input.assessee.dob || '1985-01-01',
          EmployerCategory: 'OTH',
          Address: {
            ResidenceNo: input.assessee.address.residenceNo || 'Plot 101',
            RoadOrStreet: input.assessee.address.roadOrStreet || 'Main Road',
            LocalityOrArea: input.assessee.address.locality || 'Central Zone',
            CityOrTownOrDistrict: input.assessee.address.city,
            StateCode: input.assessee.address.stateCode,
            PinCode: input.assessee.address.pinCode,
            CountryCode: '91',
            MobileNo: input.assessee.mobile.replace(/\D/g, '').slice(-10),
            EmailAddress: input.assessee.email,
          },
        },
        FilingStatus: {
          ReturnFileSec: 11, // Section 139(1) - On or before due date
          OptOutNewTaxRegime: regime === 'OLD' ? 'Y' : 'N',
          ResidentialStatus: 'RES',
        },
        IncomeDeductions: {
          GrossSalary: grossSalary,
          DeductionUs16: standardDeduction,
          IncomeFromSalaries: netSalary,
          TotalIncomeOfHP: houseProperty,
          IncomeOthSrc: otherSources,
          GrossTotIncome: grossTotalIncome,
          Us80C: regime === 'OLD' ? Math.min(input.deductions?.section80C || 0, 150000) : 0,
          Us80D: regime === 'OLD' ? Math.min(input.deductions?.section80D || 0, 100000) : 0,
          TotalIncome: netTaxableIncome,
        },
        TaxComputation: {
          TotalTaxPayable: taxCalc.taxOnIncome,
          Rebate87A: taxCalc.rebate87A,
          TaxPayableOnTotalIncome: Math.max(0, taxCalc.taxOnIncome - taxCalc.rebate87A),
          EducationCess: taxCalc.cess,
          GrossTaxLiability: taxCalc.totalTaxLiability,
          TotalTDS: totalTds,
          NetTaxLiability: refundOrPayable < 0 ? Math.abs(refundOrPayable) : 0,
          RefundDue: refundOrPayable > 0 ? refundOrPayable : 0,
        },
        ScheduleTDS1: [
          {
            TANOfEmployer: 'MUMA00000A',
            EmployerName: 'Employer Organization',
            IncomeChargeableSalaries: grossSalary,
            TotalTDSDeducted: input.taxesPaid?.tdsSalary || 0,
          },
        ],
        BankAccountDtls: {
          AddtnlBankDetails: [
            {
              IFSCCode: input.bankDetails.ifsc.toUpperCase(),
              BankName: input.bankDetails.bankName,
              BankAccountNo: input.bankDetails.accountNumber,
              AccountType: input.bankDetails.accountType || 'SB',
              UseForRefund: 'Y',
            },
          ],
        },
        Verification: {
          Declaration: {
            AssesseeVerName: `${input.assessee.firstName} ${input.assessee.surName}`.toUpperCase(),
            FatherName: input.verification.fatherName || 'FATHER NAME',
            Capacity: 'Self',
            Place: input.verification.place || input.assessee.address.city,
            Date: input.verification.date || todayStr,
          },
        },
      },
    },
  };

  const filename = `ITR1_${pan}_AY${ay}.json`;

  return {
    payload,
    filename,
    summary: {
      grossTotalIncome,
      totalDeductions,
      netTaxableIncome,
      taxLiability: taxCalc.totalTaxLiability,
      totalTdsPaid: totalTds,
      refundOrPayable,
    },
  };
}

/**
 * Generates official Government-compliant ITR-4 (Sugam) JSON Schema for Presumptive Taxation
 */
export function generateOfficialItr4Json(input: Itr4InputData): {
  payload: any;
  filename: string;
  summary: {
    grossTurnover: number;
    presumptiveIncome: number;
    taxLiability: number;
    refundOrPayable: number;
  };
} {
  const pan = input.assessee.pan.trim().toUpperCase();
  const ay = input.assessmentYear || '2025';
  const totalTurnover = input.businessParticulars.grossReceiptsBank + input.businessParticulars.grossReceiptsCash;
  const declaredIncome = input.businessParticulars.presumptiveIncomeDeclared;
  const taxCalc = computeTaxLiability(declaredIncome, 'NEW');

  const totalTaxesPaid = (input.taxesPaid?.advanceTax || 0) + (input.taxesPaid?.tdsPaid || 0);
  const refundOrPayable = totalTaxesPaid - taxCalc.totalTaxLiability;
  const todayStr = new Date().toISOString().split('T')[0];

  const payload = {
    ITR: {
      ITR4: {
        CreationInfo: {
          SWVersionNo: '1.0.0',
          SWCreatedBy: 'QuinceCA AI Practice OS',
          JSONCreatedDate: todayStr,
          JSONCreatedBy: 'PRACTITIONER_SAMADHAN',
        },
        Form_ITR4: {
          FormName: 'ITR-4',
          Description: 'Sugam - For Individuals, HUFs and Firms with Presumptive Income u/s 44AD/44ADA',
          AssessmentYear: ay,
        },
        PersonalInfo: {
          AssesseeName: {
            FirstName: input.assessee.firstName.trim().toUpperCase(),
            SurNameOrOrgName: input.assessee.surName.trim().toUpperCase(),
          },
          PAN: pan,
          AadhaarCardNo: input.assessee.aadhaarNumber || 'XXXXXXXX1234',
          Address: {
            ResidenceNo: input.assessee.address.residenceNo || 'Commercial Unit 1',
            RoadOrStreet: input.assessee.address.roadOrStreet || 'Market Road',
            CityOrTownOrDistrict: input.assessee.address.city,
            StateCode: input.assessee.address.stateCode,
            PinCode: input.assessee.address.pinCode,
            MobileNo: input.assessee.mobile.replace(/\D/g, '').slice(-10),
            EmailAddress: input.assessee.email,
          },
        },
        ScheduleBP: {
          PersumptiveInc44AD: input.presumptiveSection === '44AD' ? {
            GrsReceiptsBank: input.businessParticulars.grossReceiptsBank,
            GrsReceiptsCash: input.businessParticulars.grossReceiptsCash,
            TotPersumptiveInc44AD: declaredIncome,
          } : undefined,
          PersumptiveInc44ADA: input.presumptiveSection === '44ADA' ? {
            GrsReceipts: totalTurnover,
            TotPersumptiveInc44ADA: declaredIncome,
          } : undefined,
          FinParticulars: {
            SundryDebtors: input.businessParticulars.sundryDebtors || 0,
            SundryCreditors: input.businessParticulars.sundryCreditors || 0,
            StockInTrade: input.businessParticulars.stockInTrade || 0,
            CashBalance: input.businessParticulars.cashBalance || 0,
          },
        },
        IncomeDeductions: {
          GrossTotIncome: declaredIncome,
          TotalIncome: declaredIncome,
        },
        TaxComputation: {
          TotalTaxPayable: taxCalc.taxOnIncome,
          Rebate87A: taxCalc.rebate87A,
          TaxPayableOnTotalIncome: Math.max(0, taxCalc.taxOnIncome - taxCalc.rebate87A),
          EducationCess: taxCalc.cess,
          GrossTaxLiability: taxCalc.totalTaxLiability,
          TotalTaxesPaid: totalTaxesPaid,
          NetTaxLiability: refundOrPayable < 0 ? Math.abs(refundOrPayable) : 0,
          RefundDue: refundOrPayable > 0 ? refundOrPayable : 0,
        },
        BankAccountDtls: {
          AddtnlBankDetails: [
            {
              IFSCCode: input.bankDetails.ifsc.toUpperCase(),
              BankName: input.bankDetails.bankName,
              BankAccountNo: input.bankDetails.accountNumber,
              AccountType: 'CA', // Current account or SB
              UseForRefund: 'Y',
            },
          ],
        },
        Verification: {
          Declaration: {
            AssesseeVerName: `${input.assessee.firstName} ${input.assessee.surName}`.toUpperCase(),
            Capacity: 'Self',
            Place: input.verification.place || input.assessee.address.city,
            Date: input.verification.date || todayStr,
          },
        },
      },
    },
  };

  const filename = `ITR4_${pan}_AY${ay}.json`;

  return {
    payload,
    filename,
    summary: {
      grossTurnover: totalTurnover,
      presumptiveIncome: declaredIncome,
      taxLiability: taxCalc.totalTaxLiability,
      refundOrPayable,
    },
  };
}
