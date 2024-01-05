class LineItem {
    /**
     * @param {string} name
     * @param {string} set
     * @param {number} len  // in mm
     * @param {number} tot_cut_loss // in mm
     */ 
    constructor({ name, set, len, tot_cut_loss }) {
        this.id = 'li_'+Math.random().toString(36).substring(2);
        this.name = name;
        this.set = set;
        this.len = len;
        this.tot_cut_loss = tot_cut_loss;
        this.tot_len = this.len + this.tot_cut_loss;
    }
}

class GroupItem {
    /**
     * @param {string} name
     * @param {string} set
     * @param {number} len  // in mm
     * @param {number} quantity
     * @param {number} cut_loss // in mm
     * @param {number} cuts 
     */
    constructor({ id, name = 'L', set, len, quantity = 2, cut_loss = 8, cuts = 2 }) {
        this.id = id ?? 'gi_'+Math.random().toString(36).substring(2);
        this.name = name;
        this.set = set;
        this.len = len;
        this.quantity = quantity;
        this.cut_loss = cut_loss;
        this.cuts = cuts;
    }

    getAllLineItems(){
        let _items = [];
        for (let i = 0; i < this.quantity; i++) {
            _items.push( new LineItem({
                name: this.name,
                set: this.set,
                len: this.len,
                tot_cut_loss: this.cut_loss * this.cuts
            }));
        }
        return _items;
    }

    getAllLineItemsLen(){
        return this.getAllLineItems().length;
    }

}

class Group {
    /**
     * @param {string} name
     */
    constructor({ id, name }) {
        this.id = id ?? 'gr_'+Math.random().toString(36).substring(2);
        this.name = name;
        this.items = []; 
    }

    /**
     * @param {GroupItem} item
     * @return {void}
     */
    addItem(item){
        if(!(item instanceof GroupItem)) return;
        this.items.push(item);
    }

    /**
     * @return {Array} items  An array of GroupItems.
     */
    getAllLineItems(){
        let _items = [];
        this.items.forEach(item => {
            _items.push(...item.getAllLineItems());
        });
        return _items;
    }

    /**
     * @return {Object} items  An object with the set as the key and an array of LineItems as the value.
     */
    getAllLineItemsGroupedBySet(){
        let _items = [];
        this.items.forEach(item => {
            _items.push(...item.getAllLineItems());
        });
        
        _items.map((item, index) => {
            item.name = item.name + (index+1);
        });

        let _grouped = {};
        _items.forEach(item => {
            if (_grouped[item.set] === undefined) {
                _grouped[item.set] = [];
            }
            _grouped[item.set].push(item);
        });
        console.log('fn call',_grouped);
        return _grouped;
    }

}

export { LineItem, GroupItem, Group };