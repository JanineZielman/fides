import { createClient } from "@/prismicio";
import LogoClient from "@/components/LogoClient";

export default async function Logo() {
  const client = createClient();
  const logo = await client.getSingle("logo");


  return (
    <LogoClient images={logo.data.images} />
  );
}
