import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
export async function startFixture(port = 0) {
  const html = await readFile(new URL('./fixture.html', import.meta.url));
  const server = createServer((req, res) => { res.writeHead(200, { 'content-type':'text/html; charset=utf-8' }); res.end(html); });
  await new Promise(resolve=>server.listen(port, '127.0.0.1', resolve));
  return { url:`http://127.0.0.1:${server.address().port}`, close:()=>new Promise((resolve,reject)=>server.close(e=>e ? reject(e) : resolve())) };
}
