<script>
    import { onMount } from "svelte";

    
    // reset values:
    const min_angle = 1;
    const max_angle = 90;
    const left_anagle = 45;
    const right_angle = 45;

    const fixed_angle = 90;
    // const min_top_width = 0;
    const min_thickness = 1;
    let MinLongBaseWidth = 0;

    
    // input values
    let Abl = left_anagle;
    let Abr = right_angle;
    let Bwidth = 1000;
    let Theight = 50;
    let mounted = false;
    
    $: Atl = getAtl(Abl);
    $: Atr = getAtr(Abr);
    $: BLwidth = getBLwidth(Theight, Atl);
    $: BRwidth = getBRwidth(Theight, Atr);
    // $: HypoLeft = getHypoLeft(Theight, Atl);
    // $: HypoRight = getHypoRight(Theight, Atr);
    $: {
        MinLongBaseWidth =  parseFloat((BLwidth + BRwidth).toFixed(2));
    }
    // $: Bwidth = getBwidth(Twidth, BLwidth, BRwidth);
    $: Twidth = getTwidth(Bwidth, BLwidth, BRwidth);
    $: syncLocalStorage(Abl, Abr, Bwidth, Theight)

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

    function getTwidth(_Bwidth, _BLwidth, _BRwidth) {
        if(_Bwidth < MinLongBaseWidth) _Bwidth = MinLongBaseWidth;

        // console.log(_BLwidth, _BRwidth);
        if( isNaN(_BLwidth) ) _BLwidth = 0;
        if( isNaN(_BRwidth) ) _BRwidth = 0;

        return _Bwidth-_BLwidth-_BRwidth;
    }

    function getBLwidth(_Theight, _Atl) {
        if(_Theight < min_thickness) Theight = _Theight = min_thickness;
        return _Theight * calcTan(_Atl);
    }

    function getBRwidth(_Theight, _Atr) {
        if(_Theight < min_thickness) Theight = _Theight = min_thickness;
        return _Theight * calcTan(_Atr);
    }

    function getHypoLeft(_Theight, _Atl) {
        if(_Theight < min_thickness) Theight = _Theight = min_thickness;
        if(_Atl == 0) return _Theight;
        return _Theight / calcSin(_Atl);
    }

    function getHypoRight(_Theight, _Atr) {
        if(_Theight < min_thickness) Theight = _Theight = min_thickness;
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
        Abl = left_anagle;
        Abr = right_angle;
        Bwidth = 100;
        Theight = 50;
    }

    // monitor
    // $: console.log('Abl', Abl);
    // $: console.log('Abr', Abr);
    // $: console.log('Atl', Atl);
    // $: console.log('Atr', Atr);
    // $: console.log('Twidth', Twidth);
    // $: console.log('Theight', Theight);
    // $: console.log('BLwidth', BLwidth);
    // $: console.log('BRwidth', BRwidth);
    // $: console.log('Bwidth', Bwidth);
    // $: console.log('MinLongBaseW', MinLongBaseWidth);

    function set2Vertical(){
        Abl = 90;
        Abr = 90;
    }

    function set2FortyFive(){
        Abl = 45;
        Abr = 45;
    }

    function setLeftFortyFive(){
        Abl = 45;
        Abr = 90;
    }
    function setRightFortyFive(){
        Abl = 90;
        Abr = 45;
    }

    function syncLocalStorage(_Abl, _Abr, _Bwidth, _Theight) {
        if( !mounted ) return;

        console.log('syncLocalStorage');
        let _data = {
            Abl: _Abl,
            Abr: _Abr,
            Bwidth: _Bwidth,
            Theight: _Theight,
        }
        
        localStorage.setItem('geocalcs_trapezium_data', JSON.stringify(_data));
    }

    onMount(() => {
        let _data = localStorage.getItem('geocalcs_trapezium_data');
        if(_data) {
            _data = JSON.parse(_data);
            Abl = _data.Abl ?? left_anagle;
            Abr = _data.Abr ?? right_angle;
            Bwidth = _data.Bwidth ?? 100;
            Theight = _data.Theight ?? 50;
        }
        mounted = true;
    });

</script>

<div class="trapezium">
    <div class="mt-4">

        <table class="data-table">
            <tr>
                <td colspan="100%">
                    <div class="angle_selection_wrappper">
                        <button class="angle_selection_btn" on:click={set2Vertical}>90| |90</button>
                        <button class="angle_selection_btn" on:click={setLeftFortyFive}>45\ |90</button>
                        <button class="angle_selection_btn" on:click={set2FortyFive}>45\ /45</button>
                        <button class="angle_selection_btn" on:click={setRightFortyFive}>90| /45</button>
                    </div>
                </td>
            </tr>     
            <tr>
                <td>
                    Angle Left
                </td>
                <td>
                    <input type="number" id="Abl" bind:value={Abl} min="{min_angle}" max="{max_angle}" step="0.5" />deg
                </td>
                <td class="t-fade">
                    &nbsp;<small >(Blw)</small> {fomratNumber(BLwidth)} mm
                </td>
            </tr>
            <tr>
                <td>
                    Angle Right
                </td>
                <td>
                    <input type="number" id="Abr" bind:value={Abr} min="{min_angle}" max="{max_angle}" step="0.5" />deg
                </td>
                <td class="t-fade">
                    &nbsp;<small>(Brw)</small> {fomratNumber(BRwidth)} mm
                </td>
            </tr>
            <tr>
                <td>
                    <div>Thickness <small class="t-fade">(height)</small></div>
                </td>
                <td>
                    <input type="number" id="Abl" bind:value={Theight} min="{min_thickness}" step="0.5"/>mm
                </td>
            </tr>
            <tr>
                <td>
                    LongBaseWidth
                </td>
                <td>
                    <div>
                        <input type="number" id="Bwidth" bind:value={Bwidth} step="1" />mm
                       
                    </div>
                </td>
                <td>
                    {#if (Bwidth < MinLongBaseWidth)}
                        <small class="text-danger">(Min: {MinLongBaseWidth} mm)</small>
                    {/if}
                </td>
            </tr>
            <tr>
                <td colspan="100%" class="td-separator"></td>
            </tr>
            <tr>
                <td colspan="100%" class="td-spacer"></td>
            </tr>
            <tr>
                <td>
                    ShortBaseWidth 
                    <div>
                        <small class="t-fade">({Bwidth} - {BLwidth.toFixed(2)} - {BRwidth.toFixed(2)})</small>
                    </div>
                </td>
                <td></td>
                <td class="text-right">
                    <b>{fomratNumber(Twidth)}</b> mm
                </td>    
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td class="text-right">
                    <button on:click={resetValues} class="reset">
                        reset values
                    </button>
                </td>
            </tr>
        </table>

    </div>
</div>

<style>
    .trapezium {
        font-size: 12px;
    }

    .data-table {
        width: 100%;
        max-width: 500px;
    }
    .data-table input {
        text-align: right;
        max-width: 11ch;
    }

    .td-separator {
        height: 1rem;
        border-bottom: 2px dashed #ccc;
    }
    .td-spacer {
        height: .5rem;
    }
    .angle_selection_wrappper {
        widows: 100%;
        /* padding: 1rem; */
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .angle_selection_btn {
        padding: 0.5rem .15rem;
        /* background: none; */
        cursor: pointer;
        font-weight: bold;
        color: #333;
        border: none;
        border-bottom: 2px solid transparent;
        flex-grow: 1;
    }

    .reset {
        padding: 0.5rem .2rem;
        background: rgba(220, 56, 72, 0.25);
        cursor: pointer;
        font-weight: bold;
        color: #333;
        border: none;
        border-bottom: 2px solid transparent;
        flex-grow: 1;
    }
</style>