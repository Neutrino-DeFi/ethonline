"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";

import { PrivyProvider } from "@privy-io/react-auth";
import { NexusProvider } from "@avail-project/nexus-widgets";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ""}
        config={{
          // Create embedded wallets for users who don't have a wallet
          loginMethods: ["wallet"],
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
        }}
      >
        <NexusProvider
          config={{
            debug: false, // true to view debug logs
            network: "testnet", // "mainnet" (default) or "testnet"
          }}
        >
          <ChakraProvider>{children}</ChakraProvider>
        </NexusProvider>
      </PrivyProvider>
    </>
  );
}
