/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { HeaderBarButton } from "@api/HeaderBar";
import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { LogIcon } from "@components/Icons";
import { localStorage } from "@utils/localStorage";
import {
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalProps,
    ModalRoot,
    ModalSize,
    openModal
} from "@utils/modal";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { TextInput, Toasts, useState } from "@webpack/common";

function sanitizeToken(raw: string): string {
    let t = raw.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1).trim();
    }
    return t;
}

function applyDiscordUserToken(raw: string): void {
    const token = sanitizeToken(raw);
    if (!token) {
        throw new Error("Cole um token válido.");
    }
    if (/^Bot\s+/i.test(token)) {
        throw new Error("Tokens de bot não funcionam no cliente.");
    }

    const encoded = JSON.stringify(token);

    try {
        const mod = findByPropsLazy("setToken", "getToken") as { setToken?: (s: string) => void };
        if (typeof mod?.setToken === "function") {
            mod.setToken(token);
            location.reload();
            return;
        }
    } catch { }

    localStorage.setItem("token", encoded);
    try {
        const iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
        const w = iframe.contentWindow;
        if (w?.localStorage) w.localStorage.setItem("token", encoded);
        document.body.removeChild(iframe);
    } catch { }

    location.reload();
}

function openTokenModal() {
    openModal(props => <TokenLoginModal {...props} />);
}

function TokenLoginModal(modalProps: ModalProps) {
    const [value, setValue] = useState("");

    function submit() {
        try {
            applyDiscordUserToken(value);
        } catch (e) {
            Toasts.show({
                id: Toasts.genId(),
                message: e instanceof Error ? e.message : String(e),
                type: Toasts.Type.FAILURE,
                options: { position: Toasts.Position.BOTTOM }
            });
        }
    }

    return (
        <ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
            <ModalHeader>
                <Heading tag="h2" style={{ flexGrow: 1, margin: 0 }}>
                    Login com token
                </Heading>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent scrollbarType="none">
                <Flex
                    flexDirection="column"
                    gap="10px"
                    style={{
                        minWidth: 300,
                        maxWidth: 420,
                        paddingTop: 4,
                        paddingBottom: 8,
                        paddingLeft: 4,
                        paddingRight: 4,
                        boxSizing: "border-box"
                    }}
                >
                    <TextInput
                        style={{ width: "100%" }}
                        placeholder="Token"
                        value={value}
                        onChange={setValue}
                        type="password"
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button variant="primary" onClick={submit}>
                            Entrar
                        </Button>
                    </div>
                </Flex>
            </ModalContent>
        </ModalRoot>
    );
}

function TokenHeaderBarButton() {
    return (
        <HeaderBarButton
            tooltip="Login com token"
            icon={LogIcon}
            onClick={openTokenModal}
        />
    );
}

export default definePlugin({
    name: "TokenLogin",
    description: "Faça login em uma conta do Discord via Token.",
    authors: [{ name: "AkiraLofy", id: 1417865050835914873n }],
    dependencies: ["HeaderBarAPI"],

    headerBarButton: {
        icon: LogIcon,
        render: TokenHeaderBarButton,
        priority: 1338
    }
});
