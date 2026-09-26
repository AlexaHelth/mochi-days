import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
import MochiApp from './mochi-app';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getChatGPTUser();
 return <MochiApp signedIn={!!user} signInPath={chatGPTSignInPath('/')} />;
}
