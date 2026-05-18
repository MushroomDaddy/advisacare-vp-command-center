import type { StaffMember, Referral } from '../types';

export interface StaffMatchScore {
  staff: StaffMember;
  score: number;
  reasons: string[];
}

export function calculateBestMatch(
  referral: Referral,
  staffList: StaffMember[]
): StaffMatchScore[] {
  const matches: StaffMatchScore[] = staffList.map(staff => {
    let score = 0;
    const reasons: string[] = [];
    
    // Availability (40 points max)
    if (staff.availability === 'Available') {
      score += 40;
      reasons.push('Fully available');
    } else if (staff.availability === 'Partially') {
      score += 20;
      reasons.push('Partially available');
    }
    
    // Specialty match (30 points max)
    const specialtyMatch = staff.specialties.some(s => 
      s.toLowerCase().includes(referral.serviceType.toLowerCase()) ||
      referral.serviceType.toLowerCase().includes(s.toLowerCase())
    );
    if (specialtyMatch) {
      score += 30;
      reasons.push(`Specialty matches ${referral.serviceType}`);
    }
    
    // Today's visits (20 points max - fewer visits = higher score)
    if (staff.todayVisits === 0) {
      score += 20;
      reasons.push('No visits today');
    } else if (staff.todayVisits <= 3) {
      score += 15;
      reasons.push('Light load today');
    } else if (staff.todayVisits <= 5) {
      score += 10;
      reasons.push('Moderate load today');
    } else {
      score += 5;
      reasons.push('Heavy load today');
    }
    
    // Overtime risk (10 points max)
    if (staff.overtimeRisk === 'Low') {
      score += 10;
      reasons.push('Low overtime risk');
    } else if (staff.overtimeRisk === 'Medium') {
      score += 5;
      reasons.push('Medium overtime risk');
    }
    
    return { staff, score, reasons };
  });
  
  return matches.sort((a, b) => b.score - a.score);
}

export function getOvertimeRiskColor(risk: string): string {
  switch (risk) {
    case 'Low': return 'text-green-600';
    case 'Medium': return 'text-yellow-600';
    case 'High': return 'text-red-600';
    default: return 'text-gray-600';
  }
}
