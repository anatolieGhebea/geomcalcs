<script>
    import { onMount } from 'svelte';

    // reset values:
    const min_angle = 1;
    const max_angle = 90;
    const r_Abl = 45;
    const r_Abr = 45;
    const fixed_angle = 90;
    const min_top_width = 1;
    const min_height = 1;

    // input values
    let Abl = r_Abl;
    let Abr = r_Abr;
    let Twidth = 100;
    let Theight = 50;

    $: Atl = getAtl(Abl);
    $: Atr = getAtr(Abr);
    $: BLwidth = getBLwidth(Theight, Atl);
    $: BRwidth = getBRwidth(Theight, Atr);
    $: HypoLeft = getHypoLeft(Theight, Atl);
    $: HypoRight = getHypoRight(Theight, Atr);
    $: Bwidth = getBwidth(Twidth, BLwidth, BRwidth);

    function getAtl(_Abl) {
        if(_Abl < min_angle) Abl = _Abl = min_angle;
        if(_Abl > max_angle) Abl = _Abl = max_angle;
        return 180 - _Abl - fixed_angle;
    }

    function getAtr(_Abr) {
        if(_Abr < min_angle) Abr = _Abr = min_angle;
        if(_Abr > max_angle) Abr = _Abr = max_angle;
        
        return 180 - _Abr - fixed_angle;
    }

    function getBwidth(_Twidth, _BLwidth, _BRwidth) {
        if(_Twidth < min_top_width) Twidth = _Twidth = min_top_width;
        console.log(_BLwidth, _BRwidth);
        if( isNaN(_BLwidth) ) _BLwidth = 0;
        if( isNaN(_BRwidth) ) _BRwidth = 0;

        return _Twidth+_BLwidth+_BRwidth;
    }

    function getBLwidth(_Theight, _Atl) {
        if(_Theight < min_height) Theight = _Theight = min_height;
        return _Theight * calcTan(_Atl);
    }

    function getBRwidth(_Theight, _Atr) {
        if(_Theight < min_height) Theight = _Theight = min_height;
        return _Theight * calcTan(_Atr);
    }

    function getHypoLeft(_Theight, _Atl) {
        if(_Theight < min_height) Theight = _Theight = min_height;
        if(_Atl == 0) return _Theight;
        return _Theight / calcSin(_Atl);
    }

    function getHypoRight(_Theight, _Atr) {
        if(_Theight < min_height) Theight = _Theight = min_height;
        return _Theight / calcSin(_Atr);
    }


    function calcSin(_angle) {
        return Math.sin(_angle * Math.PI / 180);
    }

    function calcCos(_angle) {
        return Math.cos(_angle * Math.PI / 180);
    }

    function calcTan(_angle) {
        return Math.tan(_angle * Math.PI / 180);
    }

    function fomratNumber(_number) {
        return _number.toFixed(2);
    }

    function resetValues() {
        Abl = r_Abl;
        Abr = r_Abr;
        Twidth = 100;
        Theight = 50;
    }

    // monitor
    $: console.log('Abl', Abl);
    $: console.log('Abr', Abr);
    $: console.log('Atl', Atl);
    $: console.log('Atr', Atr);
    $: console.log('Twidth', Twidth);
    $: console.log('Theight', Theight);
    $: console.log('BLwidth', BLwidth);
    $: console.log('BRwidth', BRwidth);
    $: console.log('Bwidth', Bwidth);

    // draw values:
    let canvas;
    let draw_width = 900;
    let draw_height = 250;
    
    onMount(() => {
        draw_width = window.innerWidth - 20;
        const wait = setTimeout(() => {
            updateCanvas(1);
            clearTimeout(wait);
        }, 100);
    });

    $: updateCanvas(Bwidth);

    function updateCanvas(_trigger) {
        if( !canvas ) return;

        let useHeight = Theight;
        if( Theight < 50 ) useHeight = 50;

        let useWidth = Twidth;
        let useBlw = BLwidth;
        let useBrw = BRwidth;
        if( Twidth < 150 ) {
            useWidth = 150;
            useBlw = ((Bwidth/BLwidth) / 100) * useWidth;
            useBrw = ((Bwidth/BRwidth) / 100) * useWidth;
        }

        let useBw = ( useBlw + useWidth + useBrw );
        let multiplier = 1;
        let multiplierH = 1;
        if ( useBw > 5000 ) {
            multiplier = 0.125;
            multiplierH = 0.25;
        } else if ( useBw > 2500 ) {
            multiplier = 0.25;
            multiplierH = 0.5;
        } else if( useBw > 1000 ) {
            multiplier = 0.5;
            multiplierH = 0.75;
        }  

        const ctx = canvas.getContext('2d');
        ctx.canvas.width = (useBw * multiplier);
        console.log('updateCanvas', canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let margin = 5;

        let x_Atl = useBlw * multiplier;
        let y_Atl = margin;

        let x_Abl = 0;
        let y_Abl = (useHeight * multiplierH) + margin;

        let x_Atr = (useBlw + useWidth) * multiplier;
        let y_Atr = margin;

        let x_Abr = useBw * multiplier;
        let y_Abr = (useHeight * multiplierH) + margin;

        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(x_Atl, y_Atl);
        ctx.lineTo(x_Atr, y_Atr);
        ctx.lineTo(x_Abr, y_Abr);
        ctx.lineTo(x_Abl, y_Abl);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([2, 2]);

        ctx.moveTo(x_Atl, y_Atl);
        ctx.lineTo(x_Atl, (useHeight * multiplierH) + margin);

        ctx.moveTo(x_Atr, y_Atr);
        ctx.lineTo(x_Atr, (useHeight * multiplierH) + margin);
        // ctx.closePath();
        ctx.stroke();

        ctx.font = "12px Arial";
        ctx.fillText("Atl", x_Atl-10, y_Atl+25);
        ctx.fillText("Atr", x_Atr-15, y_Atr+15);
        ctx.fillText("Abl", x_Abl+7, y_Abl-5);
        ctx.fillText("Abr", x_Abr-20, y_Abr-5);
        ctx.fillText("Twidth", x_Atl+((x_Atr-x_Atl)/2)-20, y_Atl+15);
        ctx.fillText("Bwidth", x_Abl+((x_Abr-x_Abl)/2)-20, y_Abl+30);
        ctx.fillText("Blw", x_Abl+2, y_Abl+15);
        ctx.fillText("Brw", x_Abr-40, y_Abr+15);
        
    }
</script>

<div>
    <div class="d-flex" style="justify-content: space-between; align-items: center">
        <h1>trapezium</h1>
        <div>
            <button on:click={resetValues} class="danger">
                reset values
            </button>
        </div>
    </div>
    <div>
        <h4 style="margin: 0">Input params:</h4>
        <table class="data-table">
            <tr>
                <td>
                    <div>Height <small class="t-fade">(spessore)</small></div>
                    <div>
                        <input type="number" id="Abl" bind:value={Theight} min="{min_height}" step="0.1" />mm
                    </div>
                </td>
                <td>
                    <div>
                        Abl <small class="t-fade">(Angle Base Left)</small>
                    </div>
                    <div>
                        <input type="number" id="Abl" bind:value={Abl} min="{min_angle}" max="{max_angle}" step="0.1" />deg
                    </div>
                </td>
                <td>
                    <div>
                        Abr <small class="t-fade">(Angle Base Right)</small>
                    </div>
                    <div>
                        <input type="number" id="Abr" bind:value={Abr} min="{min_angle}" max="{max_angle}" step="0.1" />deg
                    </div>
                </td>
            </tr>
            <tr>
                <td></td>
                <td>
                    <div>
                        Atl <small class="t-fade">(Angle Top Left)</small>
                    </div> 
                    <div>
                        {Atl} deg
                    </div>
                </td>
                <td>
                    <div>
                        Atr <small class="t-fade">(Angle Top Right)</small>
                    </div>
                    <div>
                        {Atr} deg
                    </div>
                </td>
            </tr>

            <tr>
                <td>
                    <div>
                        Twidth
                    </div> 
                    <div>
                        <input type="number" id="Twidth" bind:value={Twidth} min="{min_top_width}" step="0.1" />mm
                    </div>
                </td>
                <td>
                    <div>Blw <small class="t-fade">(Left Triangle Base)</small></div>
                    <div>{fomratNumber(BLwidth)} mm</div>
                </td>
                <td>
                    <div>Brw <small class="t-fade">(Right Triangle Base)</small></div>
                    <div>{fomratNumber(BRwidth)} mm</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div>
                        Bwidth <small class="t-fade">(Twidth + Blw + Brw)</small>
                    </div>
                    <div>
                        {fomratNumber(Bwidth)} mm
                    </div>
                </td>    
                <td>
                    <div>
                        HypoLeft <small class="t-fade">(Theight / Sin(Atl))</small>
                    </div>
                    <div>
                        {fomratNumber(HypoLeft)} mm
                    </div>
                </td>
                <td>
                    <div>
                        HypoRight <small class="t-fade">(Theight / Sin(Atr))</small>
                    </div>
                    <div>
                        {fomratNumber(HypoRight)} mm
                    </div>
                </td>
            </tr>
        </table>
    </div>
    <div style="overflow: auto;">
        <div class="canvas" style="width: {draw_width}px;">
            <canvas bind:this={canvas} width={draw_width} height={draw_height} />
        </div>
    </div>
</div>

<style>
    /* canvas {
		width: 100%;
		height: 100%;
	} */
    .canvas {
        margin-top: 2rem;
        overflow: scroll;
        min-width: 100%;
        height: 254px;
        display: flex;
        justify-content: start;
        align-items: center;
        overflow: auto;
        padding: 2px;
    }


</style>