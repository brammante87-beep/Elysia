export class AssetCatalog {
    static getEntries() {
        return [
            { key: "building.house.wall01", source: "assets/buildings/rpg_base/rpgTile065.png" },
            { key: "building.house.wall02", source: "assets/buildings/rpg_base/rpgTile066.png" },
            { key: "building.house.trim01", source: "assets/buildings/rpg_base/rpgTile100.png" },
            { key: "nature.tree01", source: "assets/sprites/trees/tree_01.svg" },
            { key: "nature.tree01.hit", source: "assets/sprites/trees/tree_01_hit.svg" },
            { key: "object.water.source", source: "assets/sprites/water/water_source_01.svg" },
            { key: "object.water.source.use", source: "assets/sprites/water/water_source_01_use.svg" },
            { key: "object.deer", source: "assets/sprites/animals/deer_01.svg" },
            { key: "object.deer.hit", source: "assets/sprites/animals/deer_01_hit.svg" },
            { key: "character.chosen.male", source: "assets/sprites/villagers/chosen_male.svg" },
            { key: "character.chosen.female", source: "assets/sprites/villagers/chosen_female.svg" },
            { key: "character.chosen.nonbinary", source: "assets/sprites/villagers/chosen_nonbinary.svg" },
            { key: "character.villager.male01", source: "assets/sprites/villagers/villager_male_01.svg" },
            { key: "character.villager.male02", source: "assets/sprites/villagers/villager_male_02.svg" },
            { key: "character.villager.female01", source: "assets/sprites/villagers/villager_female_01.svg" },
            { key: "character.villager.female02", source: "assets/sprites/villagers/villager_female_02.svg" },
            { key: "character.villager.nonbinary01", source: "assets/sprites/villagers/villager_nonbinary_01.svg" },
            { key: "character.villager.nonbinary02", source: "assets/sprites/villagers/villager_nonbinary_02.svg" },
            { key: "character.child.male01", source: "assets/sprites/children/child_male_01.svg" },
            { key: "character.child.female01", source: "assets/sprites/children/child_female_01.svg" },
            { key: "character.child.nonbinary01", source: "assets/sprites/children/child_nonbinary_01.svg" }
        ];
    }

    static getLegacyAliases() {
        return new Map([
            ["tree", "nature.tree01"], ["treeHit", "nature.tree01.hit"],
            ["waterSource", "object.water.source"], ["waterSourceUse", "object.water.source.use"],
            ["deer", "object.deer"], ["deerHit", "object.deer.hit"],
            ["chosenMale", "character.chosen.male"], ["chosenFemale", "character.chosen.female"],
            ["chosenNonbinary", "character.chosen.nonbinary"],
            ["villager_male_01", "character.villager.male01"], ["villager_male_02", "character.villager.male02"],
            ["villager_female_01", "character.villager.female01"], ["villager_female_02", "character.villager.female02"],
            ["villager_nonbinary_01", "character.villager.nonbinary01"], ["villager_nonbinary_02", "character.villager.nonbinary02"],
            ["child_male_01", "character.child.male01"], ["child_female_01", "character.child.female01"],
            ["child_nonbinary_01", "character.child.nonbinary01"]
        ]);
    }
}
