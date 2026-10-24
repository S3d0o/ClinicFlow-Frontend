/** One physical location of the clinic (glossary, FR-ORG-02). Reference data carries both names (R9). */
export interface Branch {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  phone: string;
  /** IANA zone; all slot times at this branch are its wall-clock (ADR 0003). */
  timeZone: string;
  isActive: boolean;
}
