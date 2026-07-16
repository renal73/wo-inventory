import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try {
    const payloadJson = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

// Valid values
const VALID_CATEGORIES = ['PERBAIKAN', 'PEMBUATAN', 'INSTALASI', 'MODIFIKASI', 'KESELAMATAN'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_CLASSIFICATIONS = ['ELECTRIC', 'MECHANIC', 'SIPIL', 'OTHER'];
const VALID_JOB_CATEGORIES = ['MACHINERY', 'UTILITY', 'FACILITY_BUILDING'];
const VALID_STATUSES = ['OPEN', 'IN_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED'];
const VALID_DEPTS = ['PR', 'QC', 'GA', 'HS', 'SC', 'QA'];

export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can import
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      return NextResponse.json({ error: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported' }, { status: 400 });
    }

    // Parse file based on extension
    let dataRows: Record<string, any>[] = [];
    let headers: string[] = [];

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      dataRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

      if (dataRows.length === 0) {
        return NextResponse.json({ error: 'File Excel kosong atau tidak memiliki baris data' }, { status: 400 });
      }
      headers = Object.keys(dataRows[0]);
    } else {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Filter out comment lines and metadata
      const dataLines = lines.filter(line => !line.startsWith('#'));

      if (dataLines.length < 2) {
        return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
      }

      headers = dataLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      dataRows = [];
      for (let i = 1; i < dataLines.length; i++) {
        const values = parseCSVLine(dataLines[i]);
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        dataRows.push(row);
      }
    }

    // Helper to get value from row (case-insensitive, handles spaces)
    const getVal = (row: Record<string, any>, keys: string[]) => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(
          rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, '')
        );
        if (foundKey) return row[foundKey];
      }
      return '';
    };

    // Check required columns exist
    const hasTitle = headers.some(h => h.toLowerCase() === 'title');
    const hasDesc = headers.some(h => h.toLowerCase() === 'description');
    const hasLoc = headers.some(h => h.toLowerCase() === 'location');

    if (!hasTitle || !hasDesc || !hasLoc) {
      return NextResponse.json({
        error: 'Missing required columns. Required: Title, Description, Location',
        details: { foundHeaders: headers }
      }, { status: 400 });
    }

    // Parse data rows
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Pre-load all users for lookup
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, name: true },
    });
    const userMap = new Map(allUsers.map(u => [u.username.toLowerCase(), u]));

    // Pre-load all parts for lookup
    const allParts = await prisma.part.findMany({
      select: { id: true, name: true },
    });
    const partNameMap = new Map(allParts.map(p => [p.name.toLowerCase(), p.id]));
    const partIdMap = new Map(allParts.map(p => [p.id.toLowerCase(), p.id]));

    // Pre-load all rooms for lookup
    const allRooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const roomMap = new Map(allRooms.map(r => [r.name.toLowerCase(), r.id]));

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];

        const title = String(getVal(row, ['Title'])).trim().replace(/^"|"$/g, '');
        const description = String(getVal(row, ['Description'])).trim().replace(/^"|"$/g, '');
        const location = String(getVal(row, ['Location'])).trim().replace(/^"|"$/g, '');

        if (!title || !description || !location) {
          skipped++;
          errors.push(`Row ${i + 2}: Missing required fields (title, description, location)`);
          continue;
        }

        // Get optional fields
        const category = String(getVal(row, ['Category'])).trim().toUpperCase() || 'PERBAIKAN';
        const priority = String(getVal(row, ['Priority'])).trim().toUpperCase() || 'LOW';
        const classification = String(getVal(row, ['Classification'])).trim().toUpperCase() || null;
        const jobCategory = String(getVal(row, ['Job Category'])).trim().toUpperCase() || null;
        const status = String(getVal(row, ['Status'])).trim().toUpperCase() || 'OPEN';
        const roomName = String(getVal(row, ['Room'])).trim().replace(/^"|"$/g, '');
        const requestedDept = String(getVal(row, ['Requested Dept'])).trim().toUpperCase() || null;
        const requestedByName = String(getVal(row, ['Requested By Name'])).trim().replace(/^"|"$/g, '');
        const closedByName = String(getVal(row, ['Closed By Name'])).trim().replace(/^"|"$/g, '');
        const durationStr = String(getVal(row, ['Duration (minutes)', 'ActualDuration', 'Actual Duration'])).trim().replace(/^"|"$/g, '');
        const partsUsedStr = String(getVal(row, ['Parts Used'])).trim().replace(/^"|"$/g, '');

        // Validate enums
        const validCategory = VALID_CATEGORIES.includes(category) ? category : 'PERBAIKAN';
        const validPriority = VALID_PRIORITIES.includes(priority) ? priority : 'LOW';
        const validClassification = classification && VALID_CLASSIFICATIONS.includes(classification) ? classification : null;
        const validJobCategory = jobCategory && VALID_JOB_CATEGORIES.includes(jobCategory) ? jobCategory : null;
        const validStatus = VALID_STATUSES.includes(status) ? status : 'OPEN';
        const validDept = requestedDept && VALID_DEPTS.includes(requestedDept) ? requestedDept : null;

        // Lookup room
        let roomId: string | null = null;
        if (roomName) {
          const rid = roomMap.get(roomName.toLowerCase());
          if (rid) {
            roomId = rid;
          } else {
            // Auto-create room if not found
            const newRoom = await prisma.room.create({
              data: { name: roomName },
            });
            roomId = newRoom.id;
            roomMap.set(roomName.toLowerCase(), newRoom.id);
          }
        }

        // Lookup requester user
        let requestedById = user.id; // default to importing admin
        if (requestedByName) {
          const foundUser = userMap.get(requestedByName.toLowerCase());
          if (foundUser) {
            requestedById = foundUser.id;
          }
        }

        // Lookup closed by user
        let closedById: string | null = null;
        let durationInMinutes: number | null = null;
        let closedAt: Date | null = null;
        if (validStatus === 'CLOSED' || validStatus === 'COMPLETED') {
          if (closedByName) {
            const foundCloser = userMap.get(closedByName.toLowerCase());
            if (foundCloser) {
              closedById = foundCloser.id;
            }
          }
          if (durationStr) {
            const dur = parseInt(durationStr, 10);
            if (!isNaN(dur) && dur > 0) {
              durationInMinutes = dur;
            }
          }
          closedAt = new Date();
        }

        // Parse parts used
        const partsUsedIds: string[] = [];
        const partsUsedQuantities: Record<string, number> = {};
        if (partsUsedStr) {
          const partPairs = partsUsedStr.split(',').map(p => p.trim()).filter(Boolean);
          for (const pair of partPairs) {
            const [partRef, qtyStr] = pair.split(':').map(s => s.trim());
            if (partRef) {
              // Try to find by ID first, then by name
              let partId = partIdMap.get(partRef.toLowerCase()) || partNameMap.get(partRef.toLowerCase());
              if (!partId) {
                // Try partial match
                for (const [name, id] of partNameMap) {
                  if (name.includes(partRef.toLowerCase())) {
                    partId = id;
                    break;
                  }
                }
              }
              if (partId && !partsUsedIds.includes(partId)) {
                partsUsedIds.push(partId);
                partsUsedQuantities[partId] = parseInt(qtyStr || '1', 10) || 1;
              }
            }
          }
        }

        // Generate WO number
        const prefixMap: Record<string, string> = {
          'PERBAIKAN': 'A', 'PEMBUATAN': 'B', 'INSTALASI': 'C', 'MODIFIKASI': 'D', 'KESELAMATAN': 'E'
        };
        const prefix = prefixMap[validCategory] || 'A';
        const year = String(new Date().getFullYear()).slice(-2);
        const woPrefix = `WO-${prefix}${year}/`;
        
        const count = await prisma.workOrder.count({
          where: { woNumber: { startsWith: woPrefix } }
        });
        const sequence = String(count + 1).padStart(4, '0');
        const woNumber = `${woPrefix}${sequence}`;

        // Create work order with new fields
        await prisma.workOrder.create({
          data: {
            woNumber,
            title,
            description,
            location,
            roomId: roomId || null,
            category: validCategory as any,
            classification: validClassification as any,
            jobCategory: validJobCategory as any,
            priority: validPriority as any,
            status: validStatus as any,
            requestedById,
            requestedDept: validDept as any,
            closedById: closedById || null,
            actualDuration: durationInMinutes || null,
            closedAt: closedAt || null,
            assignedToIds: [],
            assignedNames: [],
            attachments: [],
            completionAttachments: []
          }
        });

        imported++;
      } catch (err: any) {
        skipped++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${imported} work order. ${skipped > 0 ? `${skipped} baris dilewati.` : ''}`,
      summary: {
        imported,
        skipped,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error importing work orders:', error);
    return NextResponse.json({ error: 'Failed to import work orders' }, { status: 500 });
  }
}

// Helper to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}