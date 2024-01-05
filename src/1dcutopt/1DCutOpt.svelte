<script>
    import { onMount } from 'svelte';
    import { Group, GroupItem, LineItem } from '../mixins/structs.js';
    // of type Group
    let groups = [];
    let mounted = false;
    let matrix_map = [];

    function addGroup() {
        const _groupName = prompt("Enter your input:");

        if (_groupName === null || _groupName === "") {
            alert("GroupName is required");
            return
        } 
        
        let _ng = new Group({ name: _groupName });
        // create also a default GroupItem
        let _ngi = new GroupItem({ 
            name: _groupName + "_L",
            set: 'default',
            len: 1000, 
        });
        _ng.addItem(_ngi);

        // add to groups
        groups = [...groups, _ng];
    }

    function addGroupItem(_gr) {
    
        // create also a default GroupItem
        let _ngi = new GroupItem({ 
            name: _gr.name + "_L",
            set: 'default',
            len: 1000, 
        });
        _gr.addItem(_ngi);
        groups = groups;
    }

    function removeGroup(_gr) {
        groups = groups.filter(gr => gr.id !== _gr.id);
    }

    function removeGroupItem(_gr, _grItem) {
        groups = groups.map(gr => {
            if (gr.id === _gr.id) {
                gr.items = gr.items.filter(grItem => grItem.id !== _grItem.id);
            }
            return gr;
        })
    }

    let linesBySet = {};
    // save to localStorage
    $: syncLocalStorage(groups);
    $: updateLinesBySet(groups);

    function syncLocalStorage(_groups) {
        if( !mounted ) return;
        
        console.log('syncLocalStorage');
        localStorage.setItem('geocalcs_groups', JSON.stringify(_groups));
    }

    function updateLinesBySet(_groups) {
        matrix_map = [];
        linesBySet = {};
        if( !mounted || _groups.length == 0 ) return;

        // console.log('updateLinesBySet', _groups);
        let _ns = {};
        _groups.forEach(gr => {
            let set_groups = gr.getAllLineItemsGroupedBySet();
            // console.log('sets', set_groups);

            Object.keys(set_groups).forEach(set_key => {
                // console.log('set_key', set_groups[set_key]);
                if( !_ns[set_key] ) _ns[set_key] = [];
                _ns[set_key] = [..._ns[set_key], ...set_groups[set_key]];
            });
            
        });
        console.log('linesBySet', _ns);

        // order by len asc
        Object.keys(_ns).forEach(set_key => {
            _ns[set_key] = _ns[set_key].sort((a, b) => a.len - b.len);
        });
        
        // Object.keys(_ns).forEach(set_key => {
        //     _ns[set_key] = _ns[set_key].map((lineItem, index) => {
        //         lineItem.name = lineItem.name + (index+1);
        //         return lineItem;
        //     });
        // });
        

        linesBySet = _ns;
    }

    function calculate(){
        Object.keys(linesBySet).forEach(set_key => {
            let _lineItems = linesBySet[set_key];
            performCalc(_lineItems);
        });
    }

    function performCalc(_lineItems, _set = { name: 'default', len: 6500, default_loss: 200 } ) {
        if( !Array.isArray(_lineItems) || _lineItems.length == 0 ) return;

        const usable_len = _set.len - _set.default_loss;
        let _map = [];
        // perform matrix calculation on _lineItems
        for ( let row = 0; row < _lineItems.length; row++ ){
            for( let col = 0; col < _lineItems.length; col++ ) {
                if( row == col ){
                    // manage diagonal
                    let _len = _lineItems[row].tot_len; // use the len that includes the cut loss
                    let _obj = {
                        included_lines: [_lineItems[row].name],
                        fits: _len <= usable_len,
                        used_len: _len,
                        leftover: usable_len - _len,
                    }
                    if(!_map[row]) _map[row] = [];
                    _map[row][col] = _obj;
                }

                if( row < col ){
                    // manage upper triangle
                    let _len = 0;
                    let _lines = [];
                    if( col > (row +1) ) {
                        console.log('col > (row +1)', _lineItems[col-1], _lineItems[col]);
                        _len = _map[row][col-1].used_len + _lineItems[col].tot_len; 
                        _lines = [..._map[row][col-1].included_lines, _lineItems[col].name];
                    } else {
                        _len = _lineItems[row].tot_len + _lineItems[col].tot_len; // use the len that includes the cut loss
                        _lines = [_lineItems[row].name, _lineItems[col].name];
                    }
                    let _obj = {
                        included_lines: _lines,
                        fits: _len <= usable_len,
                        used_len: _len,
                        leftover: usable_len - _len,
                    }
                    if(!_map[row]) _map[row] = [];
                    _map[row][col] = _obj;
                }

                if( row > col ){
                    // manage lower triangle
                    let _len = 0;
                    let _lines = [];
                    if( col > 0) {
                        _len = _map[row][col-1].used_len + _lineItems[col].tot_len; 
                        _lines = [..._map[row][col-1].included_lines, _lineItems[col].name];
                    } else {
                        _len = _lineItems[row].tot_len + _lineItems[col].tot_len; // use the len that includes the cut loss
                        _lines = [_lineItems[row].name, _lineItems[col].name];
                    }

                    let _obj = {
                        included_lines: _lines,
                        fits: _len <= usable_len,
                        used_len: _len,
                        leftover: usable_len - _len,
                    }
                    if(!_map[row]) _map[row] = [];
                    _map[row][col] = _obj;
                }
            }
        }
        matrix_map = _map;
    }

    onMount(() => {
        // load from localStorage
        let _str_groups = localStorage.getItem('geocalcs_groups');
        console.log('_groups from localstorage', _str_groups);
        if (_str_groups) {
            let _groups = JSON.parse(_str_groups);
            _groups = _groups.map(gr => {
                let _gr = new Group({id: gr.id, name: gr.name});
                gr.items.forEach(grItem => {
                    _gr.addItem(new GroupItem(grItem));
                });
                return _gr;
            });
            console.log('_groups from localstorage', _groups);
            groups = _groups;
        }

        mounted = true;
    });
</script>
<div>
    <div>
        <button on:click={addGroup}>Add Group</button>
    </div>
    
    <div>
        <h3 class="mt-2 mb-2">Groups</h3>
        <div class="groups">
            {#each groups as group}
                <div class="group_box px-1 py-1">
                    <div class="d-flex justify-content-between">
                        <h5>{group.name}</h5>
                        <button on:click={() => removeGroup(group)}>X</button>
                    </div>
                    <hr>
                    <div>
                        <table>
                            <tr>
                                <th class="px-2 text-left">id</th>
                                <th class="px-2 text-left">len</th>
                                <th class="px-2 text-left">quantity</th>
                                <th class="px-2 text-left">cuts</th>
                                <th class="px-2 text-left">set</th>
                                <th class="px-2 text-left"></th>
                            </tr>
                            {#each group.items as groupItem}
                                <tr>
                                    <td class="px-2 py-1">{groupItem.id}</td>
                                    <td class="px-2 py-1">
                                        <input class="text-right" style="width: 10ch" type="number" bind:value={groupItem.len} min="1" step="1"> mm
                                    </td>
                                    <td class="px-2 py-1">
                                        <input class="text-right" style="width: 7ch" type="number" bind:value={groupItem.quantity} min="1" step="1">
                                    </td>
                                    <td class="px-2 py-1">
                                        <input class="text-right" style="width: 7ch" type="number" bind:value={groupItem.cuts} min="0" max="2" step="1">
                                    </td>
                                    <td class="px-2 py-1">
                                        {groupItem.set}
                                    </td>
                                    <td class="px-2 py-1">
                                        <button on:click={() => removeGroupItem(group, groupItem)}>X</button>
                                    </td>
                                </tr>
                            {/each}
                        </table>
                    </div>
                    <hr>
                    <div class="mt-1">
                        <button on:click={() => addGroupItem(group)} >Add GroupItem</button>
                    </div>
                </div>
            {/each}
        </div>
    </div>
    <div>
        <h3 class="mt-2 mb-2">All lines By Set</h3>
        <p>For each selected set, display all the lines to be cut.</p>
        <div>
            {#each Object.keys(linesBySet) as setGroupKey }
                <div class="mt-3">
                    <h4>{setGroupKey}</h4>
                    <div class="py-2">
                        <table>
                            <tr>
                                <th class="text-left px-1">id</th>
                                <th class="text-left px-1">Name</th>
                                <th class="text-left px-1">Len</th>
                                <th class="text-left px-1">Cut Loss</th>
                                <th class="text-left px-1">Tot len</th>
                            </tr>
                            {#each linesBySet[setGroupKey] as lineItem}
                                <tr>
                                    <td class="px-1">{lineItem.id}</td>
                                    <td class="px-1">{lineItem.name}</td>
                                    <td class="px-1">{lineItem.len} mm</td>
                                    <td class="px-1">{lineItem.tot_cut_loss} mm</td>
                                    <td class="px-1">{lineItem.tot_len} mm</td>
                                </tr>
                            {/each}
                        </table>
                    </div>
                </div>
            {/each}
        </div>
    </div>
    <div>
        <h3 class="mt-2 mb-2">Calculation map</h3>
        <div>
            <button on:click={() => calculate()}>calc</button>
        </div>
        <div>
            <table>
                {#each matrix_map as row, row_index}
                    <tr>
                        {#each row as col, col_index}
                            <td class="px-1 py-1 cell-bg-{ col.fits ? 'success':'danger' } ">
                                { col.included_lines.join(',') } [{col.leftover}mm]
                            </td>
                        {/each}
                    </tr>
                {/each}
            </table>
        </div>
    </div>
</div>

<style>
    .groups {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: .5rem;
        background: #eceaea;
        padding: .5rem;
    }

    .group_box{
        border: 1px dashed #ccc;
        background: #fff;
    }

    tr > td {
        white-space: nowrap;
    }
</style>