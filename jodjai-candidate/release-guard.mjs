import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function assertSameOriginResponse(expectedOrigin,requested,status,finalUrl,redirectLocation){
 const expected=new URL(expectedOrigin).origin;
 if(expected!==expectedOrigin||new URL(requested).origin!==expected)throw Error('Requested deployment origin differs from the reviewed target');
 if(status>=300&&status<400||redirectLocation)throw Error('Origin guard: hosting redirects; stop release and preserve the original browser data');
 if(status!==200||new URL(finalUrl).origin!==expected)throw Error('Origin guard: target is unavailable or changed origin');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=JSON.parse(await readFile(new URL('./release-target.json',import.meta.url),'utf8'));
 const override=process.env.JODJAI_RELEASE_ORIGIN;
 if(override&&override!==config.origin)throw Error('Target override is not approved; require a reviewed migration and backup plan');
 for(const suffix of ['/','/service-worker.js']){
  const target=config.origin+suffix,response=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  assertSameOriginResponse(config.origin,target,response.status,response.url,response.headers.get('location'));
 }
 console.log('PASS: reviewed origin is public and returns no redirects. This is a preflight observation, not a guarantee about future hosting changes.');
}
