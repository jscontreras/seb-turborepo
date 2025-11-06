'use cache: private';

import { headers } from "next/headers";
import { UrlBreadcrumbWithPath } from "./url-breadcrumb-path"
export async function UrlBreadcrumb() {
  const hostname = (await headers()).get('host')
  return <UrlBreadcrumbWithPath hostName={hostname || ''} />
}