/*
=========================================
ELYSIA
UI
=========================================
*/

class UI {

    constructor(game){

        this.game = game;

    }

    //----------------------------------

    update(delta){

    }

    //----------------------------------

    showMainMenu(){

        document.getElementById("ui").innerHTML=`

        <div id="mainMenu">

            <div class="window">

                <h1>ELYSIA</h1>

                <h2>Nuova Partita</h2>

                <input
                    id="heroName"
                    type="text"
                    maxlength="20"
                    placeholder="Nome del Prescelto"
                >

                <h3>Identità</h3>

                <label>
                    <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked>
                    Uomo
                </label>

                <label>
                    <input
                        type="radio"
                        name="gender"
                        value="female">
                    Donna
                </label>

                <label>
                    <input
                        type="radio"
                        name="gender"
                        value="nonbinary">
                    Non binario
                </label>

                <hr>

                <h3>Orientamento</h3>

                <label>
                    <input
                        type="radio"
                        name="orientation"
                        value="straight"
                        checked>
                    Etero
                </label>

                <label>
                    <input
                        type="radio"
                        name="orientation"
                        value="gay">
                    Gay / Lesbica
                </label>

                <label>
                    <input
                        type="radio"
                        name="orientation"
                        value="bi">
                    Bisessuale
                </label>

                <label>
                    <input
                        type="radio"
                        name="orientation"
                        value="pan">
                    Pansessuale
                </label>

                <hr>

                <h3>Relazione</h3>

                <label>
                    <input
                        type="radio"
                        name="relation"
                        value="mono"
                        checked>
                    Monogamo
                </label>

                <label>
                    <input
                        type="radio"
                        name="relation"
                        value="poly">
                    Poliamoroso
                </label>

                <br><br>

                <button id="startGame">

                    Inizia

                </button>

            </div>

        </div>

        `;

        document
            .getElementById("startGame")
            .onclick=this.startGame.bind(this);

    }

    //----------------------------------

    startGame(){

        const settings={

            name:
                document.getElementById("heroName").value.trim() ||
                "Prescelto",

            gender:
                document.querySelector(
                    "input[name=gender]:checked"
                ).value,

            orientation:
                document.querySelector(
                    "input[name=orientation]:checked"
                ).value,

            relation:
                document.querySelector(
                    "input[name=relation]:checked"
                ).value

        };

        document.getElementById("ui").innerHTML="";

        this.game.start(settings);

        this.showBottomBar();

    }

    //----------------------------------

    showBottomBar(){

        const ui=document.getElementById("ui");

        ui.innerHTML=`

        <div id="bottomBar"></div>

        `;

        const bottomBar=document.getElementById("bottomBar");

        this.game.miracles.list.forEach(name=>{

            const button=document.createElement("button");

            button.className="miracleButton";

            button.dataset.miracle=name;

            button.title=name;

            button.textContent=this.getMiracleIcon(name);

            button.onclick=()=>{

                this.game.miracles.select(name);

                this.updateMiracleButtons();

            };

            bottomBar.appendChild(button);

        });

        this.updateMiracleButtons();

    }

    //----------------------------------

    updateMiracleButtons(){

        document
            .querySelectorAll(".miracleButton")
            .forEach(button=>{

                button.classList.toggle(
                    "selected",
                    button.dataset.miracle===this.game.miracles.selected
                );

            });

    }

    //----------------------------------

    getMiracleIcon(name){

        const icons={

            tree:"🌳",
            water:"💧",
            flower:"🌸",
            light:"✨",
            lightning:"⚡",
            house:"🏠",
            fertility:"💞",
            animal:"🐾"

        };

        return icons[name] || name;

    }

}
