import type { Branch } from '@/features/org/model/branch';

export const BRANCH_IDS = { nasrCity: 'br-nc', maadi: 'br-ma', sheikhZayed: 'br-sz' } as const;

export const branchesSeed: Branch[] = [
  {
    id: BRANCH_IDS.nasrCity,
    code: 'NC',
    nameEn: 'Nasr City',
    nameAr: 'مدينة نصر',
    addressEn: '14 Abbas El Akkad St., Nasr City, Cairo',
    addressAr: '14 شارع عباس العقاد، مدينة نصر، القاهرة',
    phone: '+20224018890',
    timeZone: 'Africa/Cairo',
    isActive: true,
  },
  {
    id: BRANCH_IDS.maadi,
    code: 'MA',
    nameEn: 'Maadi',
    nameAr: 'المعادي',
    addressEn: '26 Road 9, Maadi, Cairo',
    addressAr: '26 شارع 9، المعادي، القاهرة',
    phone: '+20223581120',
    timeZone: 'Africa/Cairo',
    isActive: true,
  },
  {
    id: BRANCH_IDS.sheikhZayed,
    code: 'SZ',
    nameEn: 'Sheikh Zayed',
    nameAr: 'الشيخ زايد',
    addressEn: 'Block 4, Sheikh Zayed City, Giza',
    addressAr: 'بلوك 4، مدينة الشيخ زايد، الجيزة',
    phone: '+20238514400',
    timeZone: 'Africa/Cairo',
    isActive: true,
  },
];
