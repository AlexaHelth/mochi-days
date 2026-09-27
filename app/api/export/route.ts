import { GET as readState } from '../state/route';
import { today, type State } from '@/lib/mochi';
export const dynamic='force-dynamic';
export async function GET(){
 const response=await readState();
 if(!response.ok)return response;
 const state=await response.json() as State;
 return new Response(JSON.stringify({format:'mochi-days-export',version:1,exportedAt:new Date().toISOString(),...state},null,2),{headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Content-Disposition':`attachment; filename="mochi-days-${today()}.json"`,
  'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff',
 }});
}
