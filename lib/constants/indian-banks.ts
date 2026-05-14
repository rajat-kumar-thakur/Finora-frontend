/**
 * Curated list of Indian banks for the account creation dropdown.
 *
 * Mirrors backend INDIAN_BANKS in `backend/app/models/bank_account.py`.
 * Server is the source of truth at validation time; this constant lets the
 * dropdown render instantly without a network round-trip.
 */
export const INDIAN_BANKS: string[] = [
  // Public Sector Undertaking (PSU) banks
  'State Bank of India',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Indian Bank',
  'Central Bank of India',
  'Indian Overseas Bank',
  'UCO Bank',
  'Bank of Maharashtra',
  'Punjab & Sind Bank',
  // Private sector banks
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'IDFC FIRST Bank',
  'Yes Bank',
  'Federal Bank',
  'RBL Bank',
  'Bandhan Bank',
  'South Indian Bank',
  'Karnataka Bank',
  'Karur Vysya Bank',
  'City Union Bank',
  'Tamilnad Mercantile Bank',
  'DCB Bank',
  'Dhanlaxmi Bank',
  'Jammu & Kashmir Bank',
  'IDBI Bank',
  // Small Finance Banks
  'AU Small Finance Bank',
  'Equitas Small Finance Bank',
  'Ujjivan Small Finance Bank',
  'Jana Small Finance Bank',
  'Suryoday Small Finance Bank',
  'ESAF Small Finance Bank',
  'North East Small Finance Bank',
  'Capital Small Finance Bank',
  'Fincare Small Finance Bank',
  'Shivalik Small Finance Bank',
  'Unity Small Finance Bank',
  'Utkarsh Small Finance Bank',
  // Payments banks
  'Paytm Payments Bank',
  'Airtel Payments Bank',
  'India Post Payments Bank',
  'Fino Payments Bank',
  // Foreign banks operating in India
  'Standard Chartered Bank',
  'HSBC Bank',
  'Citibank',
  'DBS Bank India',
  'Deutsche Bank India',
  // Fallback
  'Other',
]
