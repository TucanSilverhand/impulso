# Impulso

Sistema de juego para [Foundry Virtual Tabletop](https://foundryvtt.com/) que da soporte al RPG **Impulso**, centrado en una mecánica de **Impulsos** y **Consecuencias** compartidos en mesa.

> Estado: **en desarrollo**. Versión actual: `0.2.0`. Compatibilidad verificada con FoundryVTT **v13**.

## Características

- **ApplicationV2 nativo**: hojas de actor e ítem construidas sobre `ApplicationV2` + `HandlebarsApplicationMixin`.
- **Data Models tipados** con `foundry.data.fields` (sin `template.json`).
- **Tres tipos de actor**:
  - `pc` — **Protagonista**, organizado en tres verticales (profesional, social y personal) con cualidades, descriptores, focos, ventajas y desventajas.
  - `npc` — **Adversario**, con nivel de amenaza.
  - `minion` — **Secuaz**, con tamaño de grupo.
- **Recursos por actor**: Vigor (vitalidad) e Impulso (recurso de acción).
- **Estados de daño** acumulables: Rasguño 1, Rasguño 2, Herida, Herida Grave y Moribundo.
- **Contador compartido** flotante para Impulsos y Consecuencias de la mesa, sincronizado entre clientes vía socket (sólo el GM principal procesa las modificaciones).
- **Escala de resultados** integrada: éxito absoluto / gran éxito / éxito significativo / éxito simple, y los fracasos equivalentes.
- **Sistema de migración** versionado al cargar el mundo.
- **Integración con Dice So Nice**: registra los presets `Impulso · Rojo` e `Impulso · Negro`.
- **Localización**: español (`es`) por defecto.

## Instalación

### Vía URL de manifiesto (recomendada)

En FoundryVTT → *Game Systems* → *Install System* y pega:

```
https://github.com/TucanSilverhand/impulso/releases/latest/download/system.json
```

### Instalación manual

1. Descarga el `impulso.zip` de la [última release](https://github.com/TucanSilverhand/impulso/releases/latest).
2. Descomprímelo dentro de `Data/systems/` de tu instalación de Foundry de forma que quede `Data/systems/impulso/system.json`.
3. Reinicia Foundry y crea un mundo seleccionando el sistema *Impulso*.

## Mecánicas clave

### Tirada base

Cada tirada produce uno de los siete resultados de la escala. Los éxitos por encima del simple generan **Impulsos** para el grupo; los fracasos por debajo del simple generan **Consecuencias** para el GM:

| Resultado | Efecto |
|---|---|
| Éxito absoluto | +5 Impulsos |
| Gran éxito | +3 Impulsos |
| Éxito significativo | +1 Impulso |
| Éxito simple | — |
| Fracaso simple | Posible éxito gastando 2 Consecuencias |
| Fracaso significativo | +2 Consecuencias |
| Fracaso absoluto | +4 Consecuencias |

### Contador compartido

El sistema renderiza al iniciar el mundo un panel flotante (anclable y persistente por usuario) con los pools de **Impulsos** y **Consecuencias** del grupo. Los jugadores pueden incrementar/decrementar mediante peticiones por socket; sólo el GM principal escribe los cambios en los `settings`, garantizando consistencia.

### Estructura del Protagonista

Cada PC se organiza en tres **verticales** (profesional, social y personal). Cada vertical contiene descriptores principales, cualidades, ventajas, desventajas y focos (incluido un *foco de corrupción*). Adicionalmente cada PC tiene Ego (temporal y total) y Corrupción.

## Estructura del proyecto

```
impulso/
├── impulso.mjs                 # Entry point: hooks init/ready/diceSoNiceReady
├── system.json                 # Manifiesto del sistema
├── module/
│   ├── apps/
│   │   └── impulse-counter.mjs # Panel compartido de Impulsos/Consecuencias
│   ├── config/                 # IDs, settings y constantes
│   ├── data/                   # DataModels de Actor / Item
│   ├── documents/              # Subclases de Actor / Item
│   ├── sheets/                 # Hojas v2 (ActorSheetV2)
│   └── migrations.mjs          # Migración de mundos entre versiones
├── templates/                  # Plantillas Handlebars (.hbs)
├── styles/                     # CSS del sistema
├── lang/                       # Localización (es)
├── assets/                     # Iconos y recursos visuales
└── resources/
```

## Desarrollo

Requisitos: FoundryVTT v13.341 o superior. No hace falta paso de build: el sistema se carga directamente como ES Modules.

Para desarrollar en local, enlaza el repo dentro del directorio `Data/systems/` de Foundry (un *symlink* basta) y recarga el mundo tras cada cambio.

### Hooks principales

- `init` → registra settings, documentos, hojas y data models.
- `ready` → ejecuta migraciones de mundo y arranca el contador compartido.
- `diceSoNiceReady` → registra los presets de dados.

### Ramas

- `production` — rama por defecto, sirve los releases.

## Licencia

Distribuido bajo licencia [MIT](LICENSE).

## Contribuir

Issues y PRs en [github.com/TucanSilverhand/impulso](https://github.com/TucanSilverhand/impulso).
