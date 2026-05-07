const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export const ESTADO_IDS = ["rasguno1", "rasguno2", "herida", "heridaGrave", "moribundo"];

function makeTextValueField({ initialNombre = "", initialValor = 0 } = {}) {
  return new SchemaField({
    nombre: new StringField({ required: false, blank: true, initial: initialNombre }),
    valor: new NumberField({ integer: true, required: false, initial: initialValor })
  });
}

function makeTextOrigenValorField({ initialNombre = "", initialOrigen = 0, initialValor = 0 } = {}) {
  return new SchemaField({
    nombre: new StringField({ required: false, blank: true, initial: initialNombre }),
    origen: new NumberField({ integer: true, required: false, initial: initialOrigen }),
    valor: new NumberField({ integer: true, required: false, initial: initialValor })
  });
}

class ImpulsoBaseActorDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      resources: new SchemaField({
        vigor: new SchemaField({
          min: new NumberField({ integer: true, required: true, initial: 0 }),
          value: new NumberField({ integer: true, required: true, initial: 6 }),
          max: new NumberField({ integer: true, required: true, initial: 6 })
        }),
        impulse: new SchemaField({
          min: new NumberField({ integer: true, required: true, initial: 0 }),
          value: new NumberField({ integer: true, required: true, initial: 3 }),
          max: new NumberField({ integer: true, required: true, initial: 3 })
        })
      }),
      status: new SchemaField({
        edge: new NumberField({ integer: true, required: true, initial: 0 }),
        focus: new NumberField({ integer: true, required: true, initial: 0 })
      })
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData?.();
    const clampResource = (resource) => {
      if (!resource) return;
      const { min = 0, max = 0 } = resource;
      resource.value = Math.clamp(resource.value ?? 0, min, max);
    };
    clampResource(this.resources?.vigor);
    clampResource(this.resources?.impulse);
  }
}

class ImpulsoProtagonistDataModel extends ImpulsoBaseActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ego: new SchemaField({
        temp: new NumberField({ integer: true, required: true, initial: 0, min: 0 }),
        total: new NumberField({ integer: true, required: true, initial: 0, min: 0 })
      }),
      corrupcion: new NumberField({ integer: true, required: true, initial: 0, min: 0 }),
      impulsoPersonal: new NumberField({ integer: true, required: true, initial: 0, min: 0, max: 11 }),
      extrasShift: new NumberField({ integer: true, required: true, initial: 0, min: 0, max: 2 }),
      descripcion: new HTMLField({ required: false, blank: true, initial: "" }),
      equipo: new HTMLField({ required: false, blank: true, initial: "" }),
      ventajas: new HTMLField({ required: false, blank: true, initial: "" }),
      estado: new SetField(new StringField({ required: true, blank: false, choices: ESTADO_IDS }), { initial: [] }),
      vertical1: new SchemaField({
        name: makeTextValueField({ initialNombre: "profesional" }),
        descriptorPrincipal1: makeTextValueField(),
        cualidad1: makeTextValueField(),
        cualidad2: makeTextValueField(),
        cualidad3: makeTextValueField(),
        descriptor1: makeTextValueField(),
        descriptor2: makeTextValueField(),
        descriptor3: makeTextValueField(),
        ventaja1: makeTextValueField(),
        ventaja2: makeTextValueField(),
        desventaja: makeTextValueField(),
        foco1: makeTextOrigenValorField(),
        foco2: makeTextOrigenValorField(),
        focoCorrupcion: makeTextOrigenValorField(),
        descriptorPrincipal2: makeTextValueField(),
        cualidad4: makeTextValueField(),
        cualidad5: makeTextValueField(),
        cualidad6: makeTextValueField()
      }),
      vertical2: new SchemaField({
        name: makeTextValueField({ initialNombre: "social" }),
        descriptorPrincipal1: makeTextValueField(),
        cualidad1: makeTextValueField(),
        cualidad2: makeTextValueField(),
        cualidad3: makeTextValueField(),
        descriptor1: makeTextValueField(),
        descriptor2: makeTextValueField(),
        descriptor3: makeTextValueField(),
        ventaja1: makeTextValueField(),
        ventaja2: makeTextValueField(),
        desventaja: makeTextValueField(),
        foco1: makeTextOrigenValorField(),
        foco2: makeTextOrigenValorField(),
        focoCorrupcion: makeTextOrigenValorField()
      }),
      vertical3: new SchemaField({
        name: makeTextValueField({ initialNombre: "personal" }),
        descriptorPrincipal1: makeTextValueField(),
        cualidad1: makeTextValueField(),
        cualidad2: makeTextValueField(),
        cualidad3: makeTextValueField(),
        descriptor1: makeTextValueField(),
        descriptor2: makeTextValueField(),
        descriptor3: makeTextValueField(),
        ventaja1: makeTextValueField(),
        ventaja2: makeTextValueField(),
        desventaja: makeTextValueField(),
        foco1: makeTextOrigenValorField(),
        foco2: makeTextOrigenValorField(),
        focoCorrupcion: makeTextOrigenValorField()
      })
    };
  }
}

class ImpulsoAdversaryDataModel extends ImpulsoBaseActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      threat: new NumberField({ integer: true, required: true, initial: 1, min: 0 })
    };
  }
}

class ImpulsoMinionDataModel extends ImpulsoBaseActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      groupSize: new NumberField({ integer: true, required: true, initial: 3, min: 1 })
    };
  }
}

export function registerActorDataModels() {
  CONFIG.Actor.dataModels = {
    ...(CONFIG.Actor.dataModels ?? {}),
    pc: ImpulsoProtagonistDataModel,
    npc: ImpulsoAdversaryDataModel,
    minion: ImpulsoMinionDataModel
  };

  CONFIG.Actor.trackableAttributes = {
    pc: {
      bar: ["resources.vigor", "resources.impulse"],
      value: ["status.edge", "status.focus"]
    },
    npc: {
      bar: ["resources.vigor"],
      value: ["status.edge"]
    },
    minion: {
      bar: ["resources.vigor"],
      value: []
    }
  };
}
