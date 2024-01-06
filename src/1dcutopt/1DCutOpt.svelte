<script>
    import { onMount } from 'svelte';
    import { Group, GroupItem, LineItem } from '../mixins/structs.js';

    let calculation_in_progress = false;
    // of type Group
    let groups = [];
    let mounted = false;
    let matrix_map = [];
    let flattened_map = [];
    let grouped_map = [];
    const availableSets = [
        { name: 'default', len: 6500, default_loss: 100 }
    ]

    let selectedCombinationGroup = null;

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
        let _ngi2 = new GroupItem({ 
            name: _groupName + "_L",
            set: 'default',
            len: 1000, 
        });
        _ng.addItem(_ngi);
        _ng.addItem(_ngi2);

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
    let parametersBySet = {};
    // save to localStorage
    $: syncLocalStorage(groups);
    $: updateLinesBySet(groups);

    function syncLocalStorage(_groups) {
        if( !mounted ) return;
        
        console.log('syncLocalStorage');
        localStorage.setItem('geocalcs_groups', JSON.stringify(_groups));
    }

    function updateLinesBySet(_groups) {
        // matrix_map = [];
        selectedCombinationGroup = null;
        flattened_map = [];
        grouped_map = [];
        linesBySet = {};
        if( !mounted || _groups.length == 0 ) return;

        // console.log('updateLinesBySet', _groups);
        let _ns = {};
        let _perimeters_by_set = {};
        _groups.forEach(gr => {
            let set_groups = gr.getAllLineItemsGroupedBySet();
            // console.log('sets', set_groups);

            Object.keys(set_groups).forEach(set_key => {
                // console.log('set_key', set_groups[set_key]);
                if( !_ns[set_key] ) _ns[set_key] = [];
                _ns[set_key] = [..._ns[set_key], ...set_groups[set_key]];


                if(_perimeters_by_set[set_key] === undefined){
                    _perimeters_by_set[set_key] = [];
                }

                if( set_groups[set_key].length % 4 == 0 ){
                    // at least 4 lines are necessary to calculate the perimeter
                    let _perimeter = set_groups[set_key].reduce((acc, cur) => { return acc + cur.len; }, 0);
                    _perimeters_by_set[set_key] = ''+_perimeter+'';
                } else {
                    _perimeters_by_set[set_key] = '--';
                }
            });
            
        });
        console.log('linesBySet', _ns);

        // order by len asc
        Object.keys(_ns).forEach(set_key => {
            _ns[set_key] = _ns[set_key].sort((a, b) => a.len - b.len);
        });
        
        linesBySet = _ns;
        parametersBySet = _perimeters_by_set;
    }

    function getSetValues(_set_name) {
        let _set_values = availableSets.find(set => set.name === _set_name);
        if( !_set_values ) null;
        return _set_values;
    }

    function getSetUsabeLen(_set_name) {
        let _set_values = availableSets.find(set => set.name === _set_name);
        if( !_set_values ) null;
        return _set_values.len - _set_values.default_loss;
    }

    function calculate(){
        calculation_in_progress = true;
        Object.keys(linesBySet).forEach(set_key => {
            let _lineItems = linesBySet[set_key];
            let _set = getSetValues(set_key);
            if( !_set ) {
                alert('Set not found');
                return;
            };
            performCalc(_lineItems, _set);
        });
        calculation_in_progress = false;
    }

    function performCalc(_lineItems, _set = { name: 'default', len: 6500, default_loss: 200 } ) {
        if( !Array.isArray(_lineItems) || _lineItems.length == 0 ) return;

        const usable_len = _set.len - _set.default_loss;

        // check if all lines fit in the usable_len
        let _map = [];
        let _tot_len = _lineItems.reduce((acc, lineItem) => acc + lineItem.tot_len, 0);
        console.log('_tot_len', _tot_len, usable_len);
        if( _tot_len <= usable_len ) {
            // all lines fit in the usable_len;
            let _obj = {
                included_lines: _lineItems.map(lineItem => lineItem.name),
                fits: true,
                used_len: _tot_len,
                leftover: usable_len - _tot_len,
            }
            
            _map = [_obj];
        } else if ( _lineItems.length == 2 ){
            let _l1 = {
                included_lines: [_lineItems[0].name],
                fits: _lineItems[0].tot_len <= usable_len,
                used_len: _lineItems[0].tot_len,
                leftover: usable_len - _lineItems[0].tot_len,
            }
            let _l2 = {
                included_lines: [_lineItems[1].name],
                fits: _lineItems[1].tot_len <= usable_len,
                used_len: _lineItems[1].tot_len,
                leftover: usable_len - _lineItems[1].tot_len,
            }

            _map = [_l1, _l2];
        } else if ( _lineItems.length > 2 ) {
            // the max combos are _lineItems.length - 1 ( if all lines fits on one bar not entering this loop)
            let max_combos = _lineItems.length - 1;
            // max_combos = 2;
            for (let current_combo = 2; current_combo <= max_combos; current_combo++) {
                // console.log('current_combo', current_combo, max_combos);
                
                let _list = calculateCombinations(_lineItems, current_combo);
                // console.log('_list', _list);
                if(!_list || _list.length == 0) continue;
                
                for( let _ind = 0; _ind < _list.length; _ind++ ){
                    let listItems = _list[_ind];
                    // console.log('listItems', listItems);
                    let _l1 = listItems[0];
                    let _obj = {
                        included_lines: [_l1.name],
                        fits: _l1.tot_len <= usable_len,
                        used_len: _l1.tot_len,
                        leftover: usable_len - _l1.tot_len,
                    }
                    for (let _li= 1; _li < listItems.length; _li++ ){
                        let _l = listItems[_li];
                        let _tot_len = _obj.used_len + _l.tot_len;
                        _obj['included_lines'] = [..._obj.included_lines, _l.name];
                        _obj['fits'] = _tot_len <= usable_len;
                        _obj['used_len'] = _tot_len;
                        _obj['leftover'] = usable_len - _tot_len;
                    }
        
                    _map.push(_obj);
                   
                }
            } 
            // do the 1 elem combo
            for (let _li= 0; _li < _lineItems.length; _li++ ){
                let _l = _lineItems[_li];
                let _obj = {
                    included_lines: [_l.name],
                    fits: _l.tot_len <= usable_len,
                    used_len: _l.tot_len,
                    leftover: usable_len - _l.tot_len,
                }
                _map.push(_obj);
            }
        }

        console.log('_map', _map);
        flattened_map = _map;
        
        sortInGroups(_lineItems);
        // flatMap(_map, _lineItems);
    }

    //
    function sortInGroups( _lineItems){
        
        let flattened_map_ordered = flattened_map.sort((a, b) => {
            return b.included_lines.length - a.included_lines.length;
        });

        //
        grouped_map = [];
        let grouped = [];
        flattened_map_ordered.forEach((elem, index) => {
            if( elem.fits == false ) return;
            if( grouped.length == 0){
                grouped.push(
                    {
                        all_lines: elem.included_lines,
                        elements: [elem],
                    }
                );
            } else {
                let included = false;
                grouped.forEach(group => {
                    if( fitsInGroup(elem, group) ){
                        group.all_lines = [...group.all_lines, ...elem.included_lines];
                        group.elements.push(elem);
                        included = true;
                    }
                });

                if( !included ){
                    grouped.push(
                        {
                            all_lines: elem.included_lines,
                            elements: [elem],
                        }
                    );
                }
            }
        });

        // filter out groups that do no cover all lines
        grouped = grouped.filter(group => group.all_lines.length == _lineItems.length);
        grouped = filterOutEquivalents(grouped);
        grouped = filteOnlyMinPieces(grouped);
console.log('setting groups', grouped.length);
        grouped_map = grouped;

    }

    function fitsInGroup(elem, group){
        let itersects = group.all_lines.filter(line => elem.included_lines.includes(line));
        return itersects.length == 0;
    }

    function filterOutEquivalents(_groups){
        let present = [];
        let _nwgroups = [];

        for(let i = 0; i < _groups.length; i++){
            let k = 'k_';
            let elems =  _groups[i].elements;
            for(let j=0; j < elems.length; j++){
                k += '_'+elems[j].leftover
            }
            // console.log('k', k);
            if( present.includes(k) ){
                continue;
            }
            present.push(k);
            _nwgroups.push(_groups[i]);
        }

        console.log('done filtering......');
        return _nwgroups;
    }

    function filteOnlyMinPieces(_groups){
        let _nwgroups = [];
        let min_pieces = null;

        // find min pieces
        for(let i = 0; i < _groups.length; i++){
            let _len = _groups[i].elements.length;
            if( min_pieces === null ) min_pieces = _len;
            if( _len < min_pieces ) min_pieces = _len;
        }

        // fiter only groups with min length
        _nwgroups = _groups.filter(group => group.elements.length == min_pieces);
        return _nwgroups;
    }

    function calculateCombinations(elements, k){

        const result = [];

        function backtrack(temp, start) {
            if (temp.length === k) {
            result.push(temp.slice());
            return;
            }

            for (let i = start; i < elements.length; i++) {
                temp.push(elements[i]);
                backtrack(temp, i + 1);
                temp.pop();
            }
        }

        backtrack([], 0);
        return result;
    }

    
    function setSelectedCombinationGroup(_group){
        console.log('_group', _group);
        selectedCombinationGroup = _group;
        // groups = [];
    };

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
                                <th class="text-left px-1">leftOver</th>
                            </tr>
                            {#each linesBySet[setGroupKey] as lineItem}
                                <tr>
                                    <td class="px-1">{lineItem.id}</td>
                                    <td class="px-1">{lineItem.name}</td>
                                    <td class="px-1">{lineItem.len} mm</td>
                                    <td class="px-1">{lineItem.tot_cut_loss} mm</td>
                                    <td class="px-1">{lineItem.tot_len} mm</td>
                                    <td class="px-1">{getSetUsabeLen(setGroupKey)-lineItem.tot_len} mm</td>
                                </tr>
                            {/each}
                            <tr>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <div>
                            Total Elements: {linesBySet[setGroupKey].length}
                        </div>
                        <div>
                            Total Angles: { Math.floor(linesBySet[setGroupKey].length / 2 ) }
                        </div>
                    </div>
                    <div>
                        {#if parametersBySet[setGroupKey] !== undefined}
                            <div>
                               Total Perimeter: {parametersBySet[setGroupKey]} mm
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
    <div>
        <h3 class="mt-2 mb-2">Calculation</h3>
        <div>
            <button on:click={() => calculate()}>calc</button>
            {#if calculation_in_progress}
                <span>calculating...</span>
            {/if}
        </div>
        <div>
            {#if flattened_map.length > 0 && false }
                <div>
                    <h3 class="mt-2 mb-2"> List</h3>
                </div>      
                <div>
                    <table>
                        {#each flattened_map as elem }
                            <tr>
                                <td class="px-1 py-1 cell-bg-{ elem.fits ? 'success':'danger' } ">
                                    { elem.included_lines.join(',') } [ 
                                        <span class="">{elem.used_len}</span>/
                                        <span class="text-danger">{elem.leftover}</span>
                                    ]mm
                                </td>
                            </tr>
                        {/each  }
                    </table>
                            
                </div>
            {/if}
        </div>
        <div>
            {#if grouped_map.length > 0}
                <div>
                    <h3 class="mt-2 mb-2"> { selectedCombinationGroup ? 'Selected cut disposition':'List' } </h3>
                </div>      
                <div>
                    <table>
                        {#if !selectedCombinationGroup}
                            {#each grouped_map as group }
                                <tr on:click={() => setSelectedCombinationGroup(group)}>
                                    {#each group.elements as elem}
                                        <td class="px-1 py-1 cell-bg-success">
                                            { elem.included_lines.join(',') } [ 
                                                <span class="">{elem.used_len}</span>/
                                                <span class="text-danger">{elem.leftover}</span>
                                            ]mm
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        {:else}
                            <tr>
                                {#each selectedCombinationGroup.elements as elem}
                                    <td class="px-1 py-1 cell-bg-success">
                                        { elem.included_lines.join(',') } [ 
                                            <span class="">{elem.used_len}</span>/
                                            <span class="text-danger">{elem.leftover}</span>
                                        ]mm
                                    </td>
                                {/each}
                            </tr>
                        {/if}
                    </table> 
                </div>
            {/if}
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