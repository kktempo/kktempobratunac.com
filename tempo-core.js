/* =========================================================
   KK TEMPO
   TEMPO CORE
   Centralni sistem podataka za ceo Admin Panel

   TEMPO SMART
   ČLANOVI
   ČLANARINE
   EVIDENCIJA
   STATISTIKA
   SKAUTING
   FINANSIJE
   PROGRAMI
========================================================= */

(function () {

    "use strict";

    window.TEMPO = window.TEMPO || {};

    /* =====================================================
       OSNOVNA PODEŠAVANJA
    ===================================================== */

    const CORE_VERSION = "1.0.0";

    TEMPO.version = CORE_VERSION;

    TEMPO.storage = {

        clanovi: "clanarine",
        finansije: "tempoFinansije",
        troskovi: "tempoTroskovi",
        prihodi: "tempoPrihodi",
        evidencija: "evidencija",
        dolasci: "dolasci",
        statistika: "statistika",
        skauting: "skauting",
        grupe: "grupe",
        programi: "programiTreninga"

    };


    /* =====================================================
       POMOĆNE FUNKCIJE
    ===================================================== */

    function read(key, fallback = null) {

        try {

            const value =
                localStorage.getItem(key);

            if (
                value === null ||
                value === undefined
            ) {

                return fallback;

            }

            return JSON.parse(value);

        } catch (error) {

            console.warn(
                "TEMPO CORE: Greška pri čitanju:",
                key,
                error
            );

            return fallback;

        }

    }


    function write(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "TEMPO CORE: Greška pri čuvanju:",
                key,
                error
            );

            return false;

        }

    }


    function normalize(text) {

        if (
            text === null ||
            text === undefined
        ) {

            return "";

        }

        return String(text)

            .toLowerCase()

            .normalize("NFD")

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .trim();

    }


    function number(value) {

        const n =
            Number(value);

        return Number.isFinite(n)
            ? n
            : 0;

    }


    function today() {

        const d =
            new Date();

        return d
            .toISOString()
            .split("T")[0];

    }


    function currentMonth() {

        const d =
            new Date();

        return String(
            d.getMonth() + 1
        ).padStart(2, "0");

    }


    function currentYear() {

        return new Date()
            .getFullYear();

    }


    /* =====================================================
       ČLANOVI
    ===================================================== */

    TEMPO.clanovi = function () {

        const data =
            read(
                TEMPO.storage.clanovi,
                {}
            );

        if (
            Array.isArray(data)
        ) {

            return data;

        }

        return Object.entries(data)
            .map(
                ([sifra, clan]) => {

                    return {

                        sifra,

                        ...clan

                    };

                }
            );

    };


    TEMPO.brojClanova = function () {

        return TEMPO
            .clanovi()
            .length;

    };


    TEMPO.pronadjiClana = function (
        tekst
    ) {

        const query =
            normalize(tekst);

        if (!query) {

            return null;

        }

        const clanovi =
            TEMPO.clanovi();


        /* prvo šifra */

        let clan =
            clanovi.find(
                c =>
                    normalize(
                        c.sifra
                    ) === query
            );


        if (clan) {

            return clan;

        }


        /* zatim ime */

        clan =
            clanovi.find(
                c => {

                    const ime =
                        normalize(
                            c.ime ||
                            c.imePrezime ||
                            c.naziv ||
                            ""
                        );

                    return ime.includes(
                        query
                    );

                }
            );


        if (clan) {

            return clan;

        }


        /* ime + prezime */

        clan =
            clanovi.find(
                c => {

                    const kompletno =
                        normalize(
                            [
                                c.ime,
                                c.prezime
                            ]
                            .filter(Boolean)
                            .join(" ")
                        );

                    return kompletno.includes(
                        query
                    );

                }
            );


        return clan || null;

    };


    /* =====================================================
       ČLANARINE
    ===================================================== */

    TEMPO.clanarine = function () {

        return TEMPO
            .clanovi()
            .map(
                clan => {

                    return {

                        sifra:
                            clan.sifra,

                        ime:
                            clan.ime ||
                            clan.imePrezime ||
                            clan.naziv ||
                            "",

                        program:
                            clan.program ||
                            "",

                        cena:
                            number(
                                clan.cena
                            ),

                        clanarine:
                            clan.clanarine ||
                            {}

                    };

                }
            );

    };


    TEMPO.statusClanarine = function (
        sifra,
        mesec
    ) {

        const clan =
            TEMPO.pronadjiClana(
                sifra
            );


        if (!clan) {

            return {

                postoji: false,

                poruka:
                    "Član nije pronađen."

            };

        }


        const clanarine =
            clan.clanarine ||
            {};


        let zapis =
            clanarine[mesec];


        /*
           Podrška ako su meseci
           zapisani kao "avgust",
           "Avgust", "08" itd.
        */

        if (!zapis) {

            const kljuc =
                Object.keys(
                    clanarine
                )
                .find(
                    key =>
                        normalize(key) ===
                        normalize(mesec)
                );

            if (kljuc) {

                zapis =
                    clanarine[kljuc];

            }

        }


        if (!zapis) {

            return {

                postoji: true,

                clan,

                status: "NEMA PODATKA",

                iznos: 0

            };

        }


        return {

            postoji: true,

            clan,

            status:
                zapis.status ||
                "NEMA PODATKA",

            iznos:
                number(
                    zapis.iznos
                ),

            zapis

        };

    };


    TEMPO.ukupnoDugovanje = function () {

        let ukupno = 0;


        TEMPO
            .clanovi()
            .forEach(
                clan => {

                    const clanarine =
                        clan.clanarine ||
                        {};


                    Object.values(
                        clanarine
                    )
                    .forEach(
                        zapis => {

                            if (
                                zapis &&
                                (
                                    zapis.status ===
                                    "NIJE PLAĆENO"
                                    ||
                                    zapis.status ===
                                    "NIJE PLACENO"
                                )
                            ) {

                                ukupno +=
                                    number(
                                        zapis.iznos
                                    );

                            }

                        }
                    );

                }
            );


        return ukupno;

    };


    TEMPO.brojDuznika = function () {

        let broj = 0;


        TEMPO
            .clanovi()
            .forEach(
                clan => {

                    const clanarine =
                        clan.clanarine ||
                        {};

                    const imaDug =
                        Object.values(
                            clanarine
                        )
                        .some(
                            zapis =>
                                zapis &&
                                (
                                    zapis.status ===
                                    "NIJE PLAĆENO"
                                    ||
                                    zapis.status ===
                                    "NIJE PLACENO"
                                )
                        );


                    if (imaDug) {

                        broj++;

                    }

                }
            );


        return broj;

    };


    /* =====================================================
       AKTIVNE ČLANARINE
    ===================================================== */

    TEMPO.brojAktivnihClanarina =
        function () {

            let broj = 0;


            TEMPO
                .clanovi()
                .forEach(
                    clan => {

                        const clanarine =
                            clan.clanarine ||
                            {};


                        const aktivna =
                            Object.values(
                                clanarine
                            )
                            .some(
                                zapis =>
                                    zapis &&
                                    (
                                        zapis.status ===
                                        "PLAĆENO"
                                        ||
                                        zapis.status ===
                                        "PLACENO"
                                    )
                            );


                        if (aktivna) {

                            broj++;

                        }

                    }
                );


            return broj;

        };


    /* =====================================================
       DOLASCI / EVIDENCIJA
    ===================================================== */

    TEMPO.evidencija = function () {

        const keys = [

            TEMPO.storage.evidencija,

            TEMPO.storage.dolasci

        ];


        for (
            let i = 0;
            i < keys.length;
            i++
        ) {

            const data =
                read(
                    keys[i],
                    null
                );


            if (data !== null) {

                return data;

            }

        }


        return [];

    };


    TEMPO.dolasciClana = function (
        sifra
    ) {

        const evidencija =
            TEMPO.evidencija();


        const rezultat = [];


        if (
            Array.isArray(
                evidencija
            )
        ) {

            evidencija.forEach(
                zapis => {

                    if (
                        normalize(
                            zapis.sifra ||
                            zapis.clanSifra ||
                            zapis.id
                        ) ===
                        normalize(sifra)
                    ) {

                        rezultat.push(
                            zapis
                        );

                    }

                }
            );

        }


        return rezultat;

    };


    TEMPO.procenatPrisustva =
        function (
            sifra
        ) {

            const dolasci =
                TEMPO
                    .dolasciClana(
                        sifra
                    );


            if (
                !dolasci.length
            ) {

                return null;

            }


            let prisutan = 0;


            dolasci.forEach(
                zapis => {

                    const status =
                        normalize(
                            zapis.status ||
                            zapis.prisustvo ||
                            zapis.dolazak ||
                            ""
                        );


                    if (
                        status ===
                        "prisutan"
                        ||
                        status ===
                        "da"
                        ||
                        status ===
                        "true"
                    ) {

                        prisutan++;

                    }

                }
            );


            return Math.round(
                (
                    prisutan /
                    dolasci.length
                ) * 100
            );

        };


    /* =====================================================
       GRUPE
    ===================================================== */

    TEMPO.grupe = function () {

        const data =
            read(
                TEMPO.storage.grupe,
                []
            );


        return data;

    };


    TEMPO.grupaClana = function (
        sifra
    ) {

        const clan =
            TEMPO.pronadjiClana(
                sifra
            );


        if (!clan) {

            return null;

        }


        return (
            clan.grupa ||
            clan.grupaTreninga ||
            clan.program ||
            null
        );

    };


    TEMPO.clanoviGrupe =
        function (
            grupa
        ) {

            const query =
                normalize(
                    grupa
                );


            return TEMPO
                .clanovi()
                .filter(
                    clan => {

                        const g =
                            normalize(
                                clan.grupa ||
                                clan.grupaTreninga ||
                                ""
                            );

                        return (
                            g === query ||
                            g.includes(query)
                        );

                    }
                );

        };


    /* =====================================================
       STATISTIKA
    ===================================================== */

    TEMPO.statistika = function () {

        return read(
            TEMPO.storage.statistika,
            []
        );

    };


    /* =====================================================
       SKAUTING
    ===================================================== */

    TEMPO.skauting = function () {

        return read(
            TEMPO.storage.skauting,
            []
        );

    };


    /* =====================================================
       FINANSIJE
    ===================================================== */

    TEMPO.finansije = function () {

        return read(
            TEMPO.storage.finansije,
            []
        );

    };


    TEMPO.troskovi = function () {

        const data =
            read(
                TEMPO.storage.troskovi,
                []
            );


        return Array.isArray(data)
            ? data
            : [];

    };


    TEMPO.prihodi = function () {

        const data =
            read(
                TEMPO.storage.prihodi,
                []
            );


        return Array.isArray(data)
            ? data
            : [];

    };


    TEMPO.ukupniTroskovi =
        function () {

            return TEMPO
                .troskovi()
                .reduce(
                    (
                        suma,
                        trosak
                    ) => {

                        return suma +
                            number(
                                trosak.iznos
                            );

                    },
                    0
                );

        };


    TEMPO.ukupniPrihodi =
        function () {

            let ukupno = 0;


            /*
               Ako finansijski sistem
               ima posebno spremljene
               prihode.
            */

            ukupno +=
                TEMPO
                    .prihodi()
                    .reduce(
                        (
                            suma,
                            prihod
                        ) => {

                            return suma +
                                number(
                                    prihod.iznos
                                );

                        },
                        0
                    );


            /*
               Ako nema posebno spremljene
               prihode, računamo plaćene
               članarine.
            */

            if (
                ukupno === 0
            ) {

                TEMPO
                    .clanovi()
                    .forEach(
                        clan => {

                            const clanarine =
                                clan.clanarine ||
                                {};


                            Object.values(
                                clanarine
                            )
                            .forEach(
                                zapis => {

                                    if (
                                        zapis &&
                                        (
                                            zapis.status ===
                                            "PLAĆENO"
                                            ||
                                            zapis.status ===
                                            "PLACENO"
                                        )
                                    ) {

                                        ukupno +=
                                            number(
                                                zapis.iznos
                                            );

                                    }

                                }
                            );

                        }
                    );

            }


            return ukupno;

        };


    TEMPO.saldo = function () {

        return (
            TEMPO.ukupniPrihodi() -
            TEMPO.ukupniTroskovi()
        );

    };


    /* =====================================================
       FINANSIJSKI PREGLED
    ===================================================== */

    TEMPO.finansijskiPregled =
        function () {

            return {

                prihodi:
                    TEMPO.ukupniPrihodi(),

                troskovi:
                    TEMPO.ukupniTroskovi(),

                saldo:
                    TEMPO.saldo(),

                dugovanja:
                    TEMPO.ukupnoDugovanje()

            };

        };


    /* =====================================================
       KOMPLETAN PREGLED KLUBA
    ===================================================== */

    TEMPO.dashboard = function () {

        return {

            vreme:
                new Date()
                .toLocaleString(
                    "sr-RS"
                ),

            clanovi:
                TEMPO.brojClanova(),

            aktivneClanarine:
                TEMPO
                    .brojAktivnihClanarina(),

            duznici:
                TEMPO
                    .brojDuznika(),

            dugovanja:
                TEMPO
                    .ukupnoDugovanje(),

            finansije:
                TEMPO
                    .finansijskiPregled(),

            evidencija:
                TEMPO
                    .evidencija(),

            statistika:
                TEMPO
                    .statistika(),

            skauting:
                TEMPO
                    .skauting()

        };

    };


    /* =====================================================
       PRETRAGA CELOG SISTEMA
    ===================================================== */

    TEMPO.pretraga = function (
        tekst
    ) {

        const query =
            normalize(
                tekst
            );


        const rezultat = {

            clan: null,

            clanarina: null,

            dolasci: [],

            grupa: null,

            statistika: null,

            skauting: null,

            finansije:
                TEMPO
                    .finansijskiPregled()

        };


        /*
           1. ČLAN
        */

        const clan =
            TEMPO.pronadjiClana(
                tekst
            );


        if (clan) {

            rezultat.clan =
                clan;


            rezultat.grupa =
                TEMPO.grupaClana(
                    clan.sifra
                );


            rezultat.dolasci =
                TEMPO.dolasciClana(
                    clan.sifra
                );

        }


        /*
           2. AKO PITANJE SADRŽI
              ČLANARINU + IME
        */

        if (clan) {

            const mesec =
                pronadjiMesec(
                    query
                );


            if (mesec) {

                rezultat.clanarina =
                    TEMPO
                        .statusClanarine(
                            clan.sifra,
                            mesec
                        );

            }

        }


        return rezultat;

    };


    /* =====================================================
       PREPOZNAVANJE MESECA
    ===================================================== */

    function pronadjiMesec(
        pitanje
    ) {

        const meseci = {

            januar:
                "januar",

            februar:
                "februar",

            mart:
                "mart",

            april:
                "april",

            maj:
                "maj",

            jun:
                "jun",

            jul:
                "jul",

            avgust:
                "avgust",

            septembar:
                "septembar",

            oktobar:
                "oktobar",

            novembar:
                "novembar",

            decembar:
                "decembar"

        };


        for (
            const key in meseci
        ) {

            if (
                pitanje.includes(
                    key
                )
            ) {

                return meseci[key];

            }

        }


        /*
           Ako nije naveden mesec,
           koristi trenutni mesec.
        */

        const broj =
            currentMonth();


        const mapa = {

            "01":
                "januar",

            "02":
                "februar",

            "03":
                "mart",

            "04":
                "april",

            "05":
                "maj",

            "06":
                "jun",

            "07":
                "jul",

            "08":
                "avgust",

            "09":
                "septembar",

            "10":
                "oktobar",

            "11":
                "novembar",

            "12":
                "decembar"

        };


        return mapa[
            broj
        ];

    }


    /* =====================================================
       AI ODGOVOR
       Lokalni inteligentni sloj

       Ovo nije generativni AI.
       On daje odgovore iz stvarnih
       podataka TEMPO sistema.
    ===================================================== */

    TEMPO.odgovoriNaPitanje =
        function (
            pitanje
        ) {

            const q =
                normalize(
                    pitanje
                );


            /*
               BROJ ČLANOVA
            */

            if (
                q.includes(
                    "koliko"
                )
                &&
                q.includes(
                    "clan"
                )
            ) {

                return {

                    success: true,

                    odgovor:
                        `Trenutno klub ima ${TEMPO.brojClanova()} članova.`

                };

            }


            /*
               DUGOVANJA
            */

            if (
                q.includes(
                    "dug"
                )
            ) {

                return {

                    success: true,

                    odgovor:
                        `Ukupna evidentirana dugovanja iznose ${TEMPO.ukupnoDugovanje()} KM. Broj članova sa dugovanjem: ${TEMPO.brojDuznika()}.`

                };

            }


            /*
               AKTIVNE ČLANARINE
            */

            if (
                q.includes(
                    "aktiv"
                )
                &&
                q.includes(
                    "clanar"
                )
            ) {

                return {

                    success: true,

                    odgovor:
                        `Trenutno je evidentirano ${TEMPO.brojAktivnihClanarina()} članova sa plaćenom članarinom.`

                };

            }


            /*
               FINANSIJE
            */

            if (
                q.includes(
                    "prihod"
                )
                ||
                q.includes(
                    "naplat"
                )
            ) {

                const f =
                    TEMPO
                        .finansijskiPregled();


                return {

                    success: true,

                    odgovor:
                        `Ukupno evidentirani prihodi iznose ${f.prihodi} KM. Troškovi iznose ${f.troskovi} KM, a trenutni saldo je ${f.saldo} KM.`

                };

            }


            /*
               TROŠKOVI
            */

            if (
                q.includes(
                    "trosak"
                )
                ||
                q.includes(
                    "rashod"
                )
            ) {

                return {

                    success: true,

                    odgovor:
                        `Ukupni evidentirani troškovi kluba iznose ${TEMPO.ukupniTroskovi()} KM.`

                };

            }


            /*
               ČLAN + PLAĆANJE
            */

            const clan =
                TEMPO.pronadjiClana(
                    pitanje
                );


            if (
                clan
                &&
                (
                    q.includes(
                        "platio"
                    )
                    ||
                    q.includes(
                        "placeno"
                    )
                    ||
                    q.includes(
                        "clanar"
                    )
                )
            ) {

                const mesec =
                    pronadjiMesec(
                        q
                    );


                const status =
                    TEMPO.statusClanarine(
                        clan.sifra,
                        mesec
                    );


                if (
                    status.status ===
                    "PLAĆENO"
                    ||
                    status.status ===
                    "PLACENO"
                ) {

                    return {

                        success: true,

                        odgovor:
                            `DA. ${clan.ime || clan.imePrezime || clan.naziv} ima evidentiranu plaćenu članarinu za ${mesec}. Iznos: ${status.iznos} KM.`

                    };

                }


                if (
                    status.status ===
                    "NIJE PLAĆENO"
                    ||
                    status.status ===
                    "NIJE PLACENO"
                ) {

                    return {

                        success: true,

                        odgovor:
                            `NE. ${clan.ime || clan.imePrezime || clan.naziv} nema evidentiranu uplatu za ${mesec}. Dugovanje: ${status.iznos} KM.`

                    };

                }


                return {

                    success: true,

                    odgovor:
                        `Za ${clan.ime || clan.imePrezime || clan.naziv} nema evidentiranog podatka o članarini za ${mesec}.`

                };

            }


            /*
               GRUPA
            */

            if (
                clan
                &&
                (
                    q.includes(
                        "grup"
                    )
                    ||
                    q.includes(
                        "trenira"
                    )
                )
            ) {

                const grupa =
                    TEMPO.grupaClana(
                        clan.sifra
                    );


                if (grupa) {

                    return {

                        success: true,

                        odgovor:
                            `${clan.ime || clan.imePrezime || clan.naziv} je evidentiran/a u grupi ${grupa}.`

                    };

                }


                return {

                    success: true,

                    odgovor:
                        `Za ${clan.ime || clan.imePrezime || clan.naziv} trenutno nije pronađena evidentirana grupa.`

                };

            }


            /*
               DOLASCI
            */

            if (
                clan
                &&
                (
                    q.includes(
                        "dolaz"
                    )
                    ||
                    q.includes(
                        "prisust"
                    )
                )
            ) {

                const procenat =
                    TEMPO
                        .procenatPrisustva(
                            clan.sifra
                        );


                const broj =
                    TEMPO
                        .dolasciClana(
                            clan.sifra
                        )
                        .length;


                if (
                    procenat ===
                    null
                ) {

                    return {

                        success: true,

                        odgovor:
                            `Za ${clan.ime || clan.imePrezime || clan.naziv} nema dovoljno podataka u evidenciji dolazaka.`

                    };

                }


                return {

                    success: true,

                    odgovor:
                        `${clan.ime || clan.imePrezime || clan.naziv} ima evidentiranih ${broj} treninga, sa približno ${procenat}% prisustva.`

                };

            }


            /*
               KOMPLETAN PREGLED
            */

            if (
                q.includes(
                    "pregled"
                )
                ||
                q.includes(
                    "stanje kluba"
                )
                ||
                q.includes(
                    "izvestaj"
                )
            ) {

                const d =
                    TEMPO.dashboard();


                return {

                    success: true,

                    odgovor:
                        `KOMPLETAN PREGLED KLUBA\n\n` +

                        `Članovi: ${d.clanovi}\n` +

                        `Aktivne članarine: ${d.aktivneClanarine}\n` +

                        `Dužnici: ${d.duznici}\n` +

                        `Ukupna dugovanja: ${d.dugovanja} KM\n\n` +

                        `Prihodi: ${d.finansije.prihodi} KM\n` +

                        `Troškovi: ${d.finansije.troskovi} KM\n` +

                        `Saldo: ${d.finansije.saldo} KM`

                };

            }


            /*
               NEMA ODGOVORA
            */

            return {

                success: false,

                odgovor:
                    `TEMPO SMART nema dovoljno podataka da pouzdano odgovori na ovo pitanje.`,

                dostupniPodaci: [

                    "članovi",

                    "članarine",

                    "dugovanja",

                    "dolasci",

                    "grupe",

                    "finansije",

                    "statistika",

                    "skauting"

                ]

            };

        };


    /* =====================================================
       JAVNI API
    ===================================================== */

    TEMPO.getData =
        function () {

            return {

                clanovi:
                    TEMPO.clanovi(),

                clanarine:
                    TEMPO.clanarine(),

                evidencija:
                    TEMPO.evidencija(),

                grupe:
                    TEMPO.grupe(),

                statistika:
                    TEMPO.statistika(),

                skauting:
                    TEMPO.skauting(),

                finansije:
                    TEMPO.finansije(),

                troskovi:
                    TEMPO.troskovi(),

                prihodi:
                    TEMPO.prihodi()

            };

        };


    /* =====================================================
       TEST SISTEMA
    ===================================================== */

    TEMPO.test =
        function () {

            const rezultat = {

                verzija:
                    TEMPO.version,

                clanovi:
                    TEMPO.brojClanova(),

                aktivneClanarine:
                    TEMPO.brojAktivnihClanarina(),

                duznici:
                    TEMPO.brojDuznika(),

                dugovanja:
                    TEMPO.ukupnoDugovanje(),

                prihodi:
                    TEMPO.ukupniPrihodi(),

                troskovi:
                    TEMPO.ukupniTroskovi(),

                saldo:
                    TEMPO.saldo(),

                evidencija:
                    TEMPO.evidencija().length,

                statistika:
                    TEMPO.statistika().length,

                skauting:
                    TEMPO.skauting().length

            };


            console.table(
                rezultat
            );


            return rezultat;

        };


    /* =====================================================
       START
    ===================================================== */

    console.log(
        "%c TEMPO CORE %c ONLINE ",
        "background:#c8102e;color:white;font-weight:bold;padding:5px",
        "background:#111;color:#18d875;font-weight:bold;padding:5px"
    );


    console.log(
        "TEMPO CORE verzija:",
        TEMPO.version
    );


})();