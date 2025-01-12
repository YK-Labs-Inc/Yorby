import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { withAxiom } from "next-axiom";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withAxiom(withNextIntl(nextConfig));
