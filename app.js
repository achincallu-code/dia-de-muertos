
"use strict";

// ======================================
// 1. FOTOGRAFÍAS DE LA GALERÍA
// ======================================

const fotos = [
    {
        imagen: "Foto.jpg",
        titulo: "Siempre en nuestro corazón"
    },
    {
        imagen: "cempasuchil.svg",
        titulo: "El camino de cempasúchil"
    },
    {
        imagen: "ofrenda.svg",
        titulo: "Una ofrenda para recordar"
    },
    {
        imagen: "calaverita.svg",
        titulo: "Color y tradición"
    }
];

// ======================================
// 2. SIGNIFICADOS DE LA OFRENDA
// ======================================

const significados = {
    flores: {
        icono: "🏵️",
        texto: "El cempasúchil es una flor emblemática del Día de Muertos. Su color y aroma se asocian tradicionalmente con el camino simbólico que guía a las almas."
    },
    velas: {
        icono: "🕯️",
        texto: "Las velas representan la luz, la esperanza y la guía para recordar simbólicamente a los seres queridos."
    },
    pan: {
        ilustracion: "pan-de-muerto.svg",
        texto: "El pan de muerto es un alimento tradicional que se coloca en las ofrendas como parte de esta celebración mexicana."
    },
    papel: {
        ilustracion: "papel-picado.svg",
        texto: "El papel picado aporta color y movimiento a la ofrenda. Sus diseños forman parte de la decoración tradicional."
    }
};

// ======================================
// 3. ELEMENTOS DE LA PÁGINA
// ======================================

const imagen = document.getElementById("imagenOfrenda");
const titulo = document.getElementById("tituloFoto");
const puntos = document.getElementById("puntos");
const contador = document.getElementById("contador");
const musica = document.getElementById("musica");
const entradaFoto = document.getElementById("archivoFoto");
const botonCambiarFoto = document.getElementById("cambiarFoto");
const estadoFoto = document.getElementById("estadoFoto");

const botonAnterior = document.getElementById("anterior");
const botonSiguiente = document.getElementById("siguiente");
const botonRecorrido = document.getElementById("autoPlay");
const botonMusica = document.getElementById("btnMusica");

const claveFotos = "ofrendaFotosPersonalizadas";
let indice = 0;
let recorrido = null;
let reproduciendo = false;
let solicitudImagen = 0;
let fotosGuardadas = Array(fotos.length).fill(null);

try {
    const guardadas = JSON.parse(
        localStorage.getItem(claveFotos) ?? "[]"
    );

    if (Array.isArray(guardadas)) {
        fotosGuardadas = fotos.map((_, posicion) => {
            const fotoGuardada = guardadas[posicion];

            return typeof fotoGuardada === "string" &&
                fotoGuardada.startsWith("data:image/")
                ? fotoGuardada
                : null;
        });
    } else {
        throw new TypeError("El formato de las fotos guardadas no es válido.");
    }
} catch (error) {
    console.error("No se pudieron recuperar las fotos guardadas:", error);
    estadoFoto.textContent =
        "No se pudieron cargar las fotos guardadas en este navegador.";
}

fotos.forEach((foto, posicion) => {
    if (fotosGuardadas[posicion]) {
        foto.imagen = fotosGuardadas[posicion];
    }
});

// ======================================
// 4. GALERÍA DE FOTOGRAFÍAS
// ======================================

function crearPuntos() {
    const fragmento = document.createDocumentFragment();

    fotos.forEach((foto, posicion) => {
        const punto = document.createElement("button");

        punto.type = "button";
        punto.className = "punto";
        punto.setAttribute(
            "aria-label",
            `Mostrar imagen ${posicion + 1}`
        );

        punto.addEventListener("click", () => {
            indice = posicion;
            mostrarFoto();
            reiniciarRecorrido();
        });

        fragmento.appendChild(punto);
    });

    puntos.replaceChildren(fragmento);
}

function mostrarFoto() {
    const fotoActual = fotos[indice];
    const solicitudActual = ++solicitudImagen;

    titulo.textContent = fotoActual.titulo;
    contador.textContent =
        `Imagen ${indice + 1} de ${fotos.length}`;
    imagen.classList.remove("cambiando");

    document.querySelectorAll(".punto").forEach((punto, posicion) => {
        const activo = posicion === indice;

        punto.classList.toggle("activo", activo);

        if (activo) {
            punto.setAttribute("aria-current", "true");
        } else {
            punto.removeAttribute("aria-current");
        }
    });

    const nuevaImagen = new Image();

    nuevaImagen.onload = () => {
        if (solicitudActual !== solicitudImagen) return;

        const cambiarFuente = () => {
            if (solicitudActual !== solicitudImagen) return;

            imagen.src = nuevaImagen.src;
            imagen.alt = fotoActual.titulo;
            requestAnimationFrame(() => {
                if (solicitudActual === solicitudImagen) {
                    imagen.classList.remove("cambiando");
                }
            });
        };

        if (imagen.src === nuevaImagen.src) {
            cambiarFuente();
            return;
        }

        imagen.classList.add("cambiando");
        window.setTimeout(cambiarFuente, 350);
    };

    nuevaImagen.onerror = () => {
        if (solicitudActual !== solicitudImagen) return;

        imagen.classList.remove("cambiando");
        titulo.textContent = "No se pudo cargar la fotografía";
        imagen.alt = "Fotografía no disponible";
    };

    nuevaImagen.src = fotoActual.imagen;
}

function cambiarFoto(direccion) {
    indice = (indice + direccion + fotos.length) % fotos.length;
    mostrarFoto();
    reiniciarRecorrido();
}

botonAnterior.addEventListener("click", () => cambiarFoto(-1));
botonSiguiente.addEventListener("click", () => cambiarFoto(1));

botonCambiarFoto.addEventListener("click", () => entradaFoto.click());

entradaFoto.addEventListener("change", async () => {
    const archivo = entradaFoto.files?.[0];

    if (!archivo) return;

    entradaFoto.value = "";

    if (!archivo.type.startsWith("image/")) {
        estadoFoto.textContent = "Selecciona un archivo de imagen.";
        return;
    }

    try {
        const bitmap = await createImageBitmap(archivo);
        const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const lienzo = document.createElement("canvas");

        lienzo.width = Math.round(bitmap.width * escala);
        lienzo.height = Math.round(bitmap.height * escala);
        lienzo.getContext("2d").drawImage(
            bitmap,
            0,
            0,
            lienzo.width,
            lienzo.height
        );
        bitmap.close();

        const imagenGuardada = lienzo.toDataURL("image/jpeg", 0.85);
        const fotosActualizadas = [...fotosGuardadas];
        fotosActualizadas[indice] = imagenGuardada;

        localStorage.setItem(claveFotos, JSON.stringify(fotosActualizadas));

        fotosGuardadas = fotosActualizadas;
        fotos[indice].imagen = imagenGuardada;
        mostrarFoto();
        estadoFoto.textContent =
            `Foto ${indice + 1} actualizada: ${archivo.name}. Se guardó en este navegador.`;
    } catch (error) {
        console.error("No se pudo guardar la fotografía:", error);
        estadoFoto.textContent =
            "No se pudo guardar la foto. Prueba con otra imagen más pequeña.";
    }
});

document.addEventListener("keydown", (evento) => {
    const elemento = evento.target;

    if (
        elemento instanceof HTMLElement &&
        (
            elemento.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName)
        )
    ) {
        return;
    }

    if (evento.key === "ArrowLeft") {
        cambiarFoto(-1);
    }

    if (evento.key === "ArrowRight") {
        cambiarFoto(1);
    }
});

// ======================================
// 5. RECORRIDO AUTOMÁTICO
// ======================================

function iniciarRecorrido() {
    if (recorrido !== null) return;

    recorrido = setInterval(() => {
        indice = (indice + 1) % fotos.length;
        mostrarFoto();
    }, 4000);

    reproduciendo = true;

    botonRecorrido.textContent = "⏸ Pausar recorrido";
    botonRecorrido.classList.add("activo");
    botonRecorrido.setAttribute("aria-pressed", "true");
}

function detenerRecorrido() {
    if (recorrido !== null) {
        clearInterval(recorrido);
    }

    recorrido = null;
    reproduciendo = false;

    botonRecorrido.textContent = "▶ Recorrido automático";
    botonRecorrido.classList.remove("activo");
    botonRecorrido.setAttribute("aria-pressed", "false");
}

function reiniciarRecorrido() {
    if (reproduciendo) {
        detenerRecorrido();
        iniciarRecorrido();
    }
}

botonRecorrido.addEventListener("click", () => {
    if (reproduciendo) {
        detenerRecorrido();
    } else {
        iniciarRecorrido();
    }
});

// ======================================
// 6. TARJETAS INTERACTIVAS
// ======================================

const tarjetas = document.querySelectorAll(".tarjeta");
const detalle = document.getElementById("detalle");

tarjetas.forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => {
        tarjetas.forEach((otra) => {
            otra.classList.remove("seleccionada");
            otra.setAttribute("aria-pressed", "false");
        });

        tarjeta.classList.add("seleccionada");
        tarjeta.setAttribute("aria-pressed", "true");

        const elemento = tarjeta.dataset.detalle;
        const significado = significados[elemento];

        if (!significado) return;

        const icono = document.createElement("span");
        icono.className = "icono-detalle";

        if (significado.ilustracion) {
            const ilustracion = document.createElement("img");
            ilustracion.className = "icono-elemento";
            ilustracion.src = significado.ilustracion;
            ilustracion.alt = "";
            icono.appendChild(ilustracion);
        } else {
            icono.textContent = significado.icono;
        }

        const texto = document.createElement("p");
        texto.textContent = significado.texto;

        detalle.replaceChildren(icono, texto);
    });

    tarjeta.setAttribute("aria-pressed", "false");
});

// ======================================
// 7. MÚSICA
// ======================================

botonMusica.setAttribute("aria-pressed", "false");

botonMusica.addEventListener("click", async () => {
    if (musica.paused) {
        try {
            await musica.play();

            botonMusica.textContent = "⏸ Pausar música";
            botonMusica.classList.add("activo");
            botonMusica.setAttribute("aria-pressed", "true");
        } catch (error) {
            console.error("No se pudo reproducir la música:", error);

            alert(
                "No se pudo reproducir la música. " +
                "Comprueba que Muertos.mp3 esté en la carpeta del proyecto."
            );
        }
    } else {
        musica.pause();

        botonMusica.textContent = "♫ Reproducir música";
        botonMusica.classList.remove("activo");
        botonMusica.setAttribute("aria-pressed", "false");
    }
});

musica.addEventListener("ended", () => {
    botonMusica.textContent = "♫ Reproducir música";
    botonMusica.classList.remove("activo");
    botonMusica.setAttribute("aria-pressed", "false");
});

// ======================================
// 8. PREGUNTAS DEL MINI-JUEGO
// ======================================

const preguntas = [
    {
        pregunta: "¿Qué flor se utiliza tradicionalmente en la ofrenda?",
        opciones: ["Rosa", "Cempasúchil", "Tulipán"],
        correcta: 1
    },
    {
        pregunta: "¿Qué simbolizan las velas en la ofrenda?",
        opciones: [
            "La luz que guía simbólicamente a los seres queridos",
            "La llegada de la lluvia",
            "El inicio de la primavera"
        ],
        correcta: 0
    },
    {
        pregunta: "¿Cuál es un alimento tradicional del Día de Muertos?",
        opciones: ["Pizza", "Pan de muerto", "Hamburguesa"],
        correcta: 1
    },
    {
        pregunta: "¿Qué aporta el papel picado a la ofrenda?",
        opciones: [
            "Color y decoración tradicional",
            "Iluminación eléctrica",
            "Agua para las flores"
        ],
        correcta: 0
    }
];

let preguntaActual = 0;
let puntosJuego = 0;
let respondida = false;

const progresoPregunta = document.getElementById("progresoPregunta");
const preguntaTexto = document.getElementById("pregunta");
const opciones = document.getElementById("opciones");
const mensajeJuego = document.getElementById("mensajeJuego");
const siguientePregunta = document.getElementById("siguientePregunta");
const resultadoJuego = document.getElementById("resultadoJuego");
const puntuacionFinal = document.getElementById("puntuacionFinal");
const reiniciarJuego = document.getElementById("reiniciarJuego");
const marcador = document.getElementById("marcador");
const progresoBarra = document.getElementById("progresoBarra");

function actualizarProgreso() {
    progresoPregunta.textContent =
        `Pregunta ${preguntaActual + 1} de ${preguntas.length}`;

    marcador.textContent = `⭐ ${puntosJuego} puntos`;

    progresoBarra.style.width =
        `${(preguntaActual / preguntas.length) * 100}%`;
}

function mostrarPregunta() {
    const actual = preguntas[preguntaActual];

    respondida = false;

    actualizarProgreso();

    preguntaTexto.textContent = actual.pregunta;
    mensajeJuego.textContent = "Elige una respuesta para continuar.";

    siguientePregunta.disabled = true;
    siguientePregunta.hidden = false;
    resultadoJuego.hidden = true;

    opciones.replaceChildren();

    actual.opciones.forEach((texto, indiceOpcion) => {
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "opcion";
        boton.textContent = texto;

        boton.addEventListener("click", () => {
            if (respondida) return;

            respondida = true;

            const esCorrecta = indiceOpcion === actual.correcta;

            if (esCorrecta) {
                puntosJuego++;
                mensajeJuego.textContent = "¡Respuesta correcta! 🎉";
                boton.classList.add("correcta");
            } else {
                boton.classList.add("incorrecta");

                mensajeJuego.textContent =
                    `La respuesta correcta es: ${actual.opciones[actual.correcta]}.`;
            }

            opciones.querySelectorAll("button").forEach((opcion, posicion) => {
                opcion.disabled = true;

                if (posicion === actual.correcta) {
                    opcion.classList.add("correcta");
                }
            });

            marcador.textContent = `⭐ ${puntosJuego} puntos`;
            siguientePregunta.disabled = false;
        });

        opciones.appendChild(boton);
    });
}

siguientePregunta.addEventListener("click", () => {
    if (!respondida) return;

    preguntaActual++;

    if (preguntaActual < preguntas.length) {
        mostrarPregunta();
        return;
    }

    progresoPregunta.textContent = "Reto completado";
    progresoBarra.style.width = "100%";
    marcador.textContent = `⭐ ${puntosJuego} de ${preguntas.length}`;

    preguntaTexto.textContent = "¡Has terminado el reto!";
    opciones.replaceChildren();

    mensajeJuego.textContent = "";
    siguientePregunta.hidden = true;
    resultadoJuego.hidden = false;

    const porcentaje = Math.round(
        (puntosJuego / preguntas.length) * 100
    );

    puntuacionFinal.textContent =
        `Obtuviste ${puntosJuego} de ${preguntas.length} puntos (${porcentaje}%). ` +
        (
            puntosJuego === preguntas.length
                ? "¡Excelente! Conoces muy bien esta tradición."
                : "¡Buen trabajo! Puedes volver a intentarlo."
        );
});

reiniciarJuego.addEventListener("click", () => {
    preguntaActual = 0;
    puntosJuego = 0;
    mostrarPregunta();
});

// ======================================
// 9. ALTAR INTERACTIVO
// ======================================

const velasAltar = document.querySelectorAll(".vela");
const formularioDedicatoria = document.getElementById("formDedicatoria");
const entradaDedicatoria = document.getElementById("nombreDedicatoria");
const nombreRecuerdo = document.getElementById("nombreRecuerdo");
const mensajeAltar = document.getElementById("mensajeAltar");
const fotosRecuerdo = [
    { input: document.getElementById("subirPersona"), image: document.getElementById("fotoPersona"), key: "ofrendaRetratoPersona" },
    { input: document.getElementById("subirAnimal"), image: document.getElementById("fotoAnimal"), key: "ofrendaRetratoAnimal" }
];

fotosRecuerdo.forEach(({ input, image, key }) => {
    try {
        const fotoGuardada = localStorage.getItem(key);
        if (fotoGuardada?.startsWith("data:image/")) image.src = fotoGuardada;
    } catch (error) {
        console.info("Las fotos del altar solo estarán disponibles durante esta visita.", error);
    }

    input.addEventListener("change", async () => {
        const archivo = input.files?.[0];
        input.value = "";
        if (!archivo) return;

        if (!archivo.type.startsWith("image/")) {
            mensajeAltar.textContent = "Elige un archivo de imagen para este recuerdo.";
            return;
        }

        try {
            const bitmap = await createImageBitmap(archivo);
            const escala = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
            const lienzo = document.createElement("canvas");
            lienzo.width = Math.round(bitmap.width * escala);
            lienzo.height = Math.round(bitmap.height * escala);
            lienzo.getContext("2d").drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
            bitmap.close();

            const fotoComprimida = lienzo.toDataURL("image/jpeg", 0.72);
            image.src = fotoComprimida;
            image.classList.add("foto-cargada");
            try {
                localStorage.setItem(key, fotoComprimida);
                mensajeAltar.textContent = "Foto añadida al altar; el recuerdo se guardó en este navegador.";
            } catch (error) {
                mensajeAltar.textContent = "Foto añadida al altar. No hubo espacio para guardarla después de cerrar la página.";
            }
        } catch (error) {
            console.error("No se pudo preparar la foto del altar:", error);
            mensajeAltar.textContent = "No se pudo cargar esa foto. Prueba con otra imagen.";
        }
    });
});

velasAltar.forEach((vela, posicion) => {
    vela.addEventListener("click", () => {
        const encendida = vela.classList.toggle("encendida");
        vela.setAttribute("aria-pressed", String(encendida));
        vela.setAttribute(
            "aria-label",
            `${encendida ? "Apagar" : "Encender"} vela ${posicion === 0 ? "izquierda" : "derecha"}`
        );

        const velasEncendidas = [...velasAltar].filter((item) =>
            item.classList.contains("encendida")
        ).length;
        mensajeAltar.textContent = velasEncendidas
            ? `${velasEncendidas === 1 ? "Una vela" : `${velasEncendidas} velas`} mantiene${velasEncendidas === 1 ? "" : "n"} viva la luz del recuerdo.`
            : "La luz espera. Toca una vela para volver a encenderla.";
    });
});

formularioDedicatoria.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nombre = entradaDedicatoria.value.trim();

    if (!nombre) {
        entradaDedicatoria.focus();
        mensajeAltar.textContent = "Escribe un nombre o recuerdo para dedicar esta luz.";
        return;
    }

    nombreRecuerdo.textContent = nombre;
    velasAltar.forEach((vela, posicion) => {
        vela.classList.add("encendida");
        vela.setAttribute("aria-pressed", "true");
        vela.setAttribute("aria-label", `Apagar vela ${posicion === 0 ? "izquierda" : "derecha"}`);
    });
    mensajeAltar.textContent = `La luz de este altar está dedicada a ${nombre}.`;
    entradaDedicatoria.value = "";
});

// ======================================
// 10. PUENTE DE CEMPASÚCHIL
// ======================================

const escenaPuente = document.getElementById("escenaPuente");
const botonPuente = document.getElementById("encenderPuente");
const mensajePuente = document.getElementById("mensajePuente");

botonPuente.addEventListener("click", () => {
    const encendido = escenaPuente.classList.toggle("puente-encendido");
    botonPuente.setAttribute("aria-pressed", String(encendido));
    botonPuente.textContent = encendido ? "✧ Apagar el camino" : "✧ Encender el camino";
    mensajePuente.textContent = encendido
        ? "El puente está iluminado. Xólotl y Yolotl te acompañan."
        : "Los alebrijes esperan para acompañarte.";
});

// ======================================
// 11. INICIAR LA PÁGINA
// ======================================

crearPuntos();
mostrarFoto();
mostrarPregunta();

// Aparición progresiva de cada sección al entrar en pantalla.
if (
    "IntersectionObserver" in window
) {
    document.documentElement.classList.add("movimiento-listo");
    const observadorSecciones = new IntersectionObserver((entradas, observador) => {
        entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;

            entrada.target.classList.add("visible");
            observador.unobserve(entrada.target);
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".animar-entrada").forEach((seccion) => {
        observadorSecciones.observe(seccion);
    });
}
