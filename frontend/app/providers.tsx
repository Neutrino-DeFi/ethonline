"use client";

import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";

import { PrivyProvider } from "@privy-io/react-auth";

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
        <ChakraProvider>{children}</ChakraProvider>
      </PrivyProvider>
    </>
  );
}
