"use client";

import { useEffect, useRef } from "react";

const ASCII_ART: string = String.raw`
                         ---------
                      ---=-==-=-====--
                    =======-======-===-
                   =======*##%%#*+==++==
                   =++##**+---=*@@@%+++==
                  #+#%+*##%###*+++*%@%+++
                  *%@%%%#%%%%%##*##%@@%*+
                  %%#++###**********#%%#*
                  @%+-=+****++*#%*#++#%*
                  @%+-=======+++*++++#%*
                   +=-==++=-=++++++=+##
           =++++++*#+-===+*++++++===+#
       +++++*####%%@*===+****++++==+#*
    +****###%%@@@@@@+====+++++++==*@@%*++*
  %#####%%%@%@@@@@@@+=====+++++++@@@@@%##****
 ###%#%%@@@@@@@@@@@@#+++++++++++%@@@@@@@@%%#***
 #%%@@%%@@@@@@@@@@@@@%*+++++++*%@@@@@@@@@%@@%%##
 %%%@@@@@@@@@@@@@@@@@@@###**#%@@@@@@@@@@@@@@@@%%#
%@@@@@@@@@@@@@@@@@@@@@@@@%%%@@@@@@@@@@@@@@@@@@@@%
%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`;

const ASCII_TEXT_ART: string = String.raw`
 ____                _   _              _
/ ___| _   _ _ __   | \ | | ___ _ __ __| |___
\___ \| | | | '_ \  |  \| |/ _ \ '__/ _\` / __|
 ___) | |_| | |_) | | |\  |  __/ | | (_| \__ \
|____/ \__,_| .__/  |_| \_|\___|_|  \__,_|___/
            |_|
`;

function isConsoleLikelyOpen() {
    if (typeof window === "undefined") {
        return false;
    }

    const widthDelta = window.outerWidth - window.innerWidth;
    const heightDelta = window.outerHeight - window.innerHeight;

    return widthDelta > 160 || heightDelta > 160;
}

export default function ConsoleArtLogger() {
    const hasLogged = useRef(false);

    useEffect(() => {
        const logArt = () => {
            if (hasLogged.current || !isConsoleLikelyOpen()) {
                return;
            }

            hasLogged.current = true;
            console.log(`${ASCII_ART}${ASCII_TEXT_ART}`);
        };

        logArt();

        window.addEventListener("resize", logArt);
        const interval = window.setInterval(logArt, 500);

        return () => {
            window.removeEventListener("resize", logArt);
            window.clearInterval(interval);
        };
    }, []);

    return null;
}
