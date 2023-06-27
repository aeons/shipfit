import {EftParser} from "./eft-parser";
import {FittingParser} from "./fitting-parser";
import {generateFittingWheelSvg} from "./fitting-wheel";
import {elem} from "./html-builder";
import {CopyIcon, createIcon} from "./icons";

export interface FittingElement extends HTMLElement {}

interface FittingAttributes {}

class Fitting extends HTMLElement implements FittingElement {
    private root: ShadowRoot;
    private originalText: string;

    static get observedAttributes() {
        return ["hide-copy", "hide-charges"]
    }

    attributeChangedCallback() {
        this.render(this.textContent);
    }

    get config(): FittingAttributes {
        return {};
    }

    constructor() {
        super();
        this.root = this.attachShadow({mode: "open"});
        this.originalText = "";
    }

    connectedCallback() {
        // Chrome can't see text at this point and tests can't trigger mutation observer. Just attempt to render either way for now
        this.render(this.textContent);

        const observer = new MutationObserver((mutations: MutationRecord[], observer) => {
            if (mutations.length > 0) {
                const textContent = mutations[0].addedNodes[0].textContent;
                this.render(textContent);
            }
        });
        observer.observe(this, {childList: true});
    }

    private render(textContent: string | null) {
        this.originalText = textContent || "";
        if (!textContent) {
            this.root.textContent = "Error - No fit provided";
            return;
        }

        const eftFit = new EftParser().parse(textContent);
        const fit = new FittingParser().parse(eftFit);
        this.root.innerHTML = "";
        this.root.append(
            this.getCss(),
            elem("div").classes("wrapper").children(
                this.getButtonTray(),
                generateFittingWheelSvg(fit, !this.hasAttribute("hide-charges")),
            ).build()
        )
    }

    getButtonTray() {
        const buttonTray = elem("div").classes("button-tray").build();

        if (!this.hasAttribute("hide-copy")) {
            const copyIcon = createIcon(CopyIcon, "icon", "copyIcon");
            copyIcon.addEventListener("click", () => {
                navigator.clipboard.writeText(this.originalText);
            });
            buttonTray.appendChild(copyIcon);
        }

        return buttonTray;
    }


    getCss() {
        return new DOMParser().parseFromString(`
        <style>
        .fitting-circle {
            max-width: 500px;
            display: inline-block;  
        }
        .wrapper {
            position: relative;
            display: inline;
            
        }
        .button-tray {
            position: absolute;
            left: 93%;
            width: 7%;
            opacity: 40%;
        }
        .icon {
        }
        .icon:hover {
            filter: drop-shadow(3px 3px 1px gray);
        }
        .icon:active {
            transform: translateY(4px);
        }
        </style>`, "text/html").documentElement;
    }
}

customElements.define("ship-fit", Fitting);