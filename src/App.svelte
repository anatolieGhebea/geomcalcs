<script>
    import { onMount } from 'svelte';

    let tabs = [
        { name: 'trapezium', component: 'Trapezium' },
        // { name: 'triangle', component: 'Triangle' },
    ]

    let selectedTab = null;

    function selectTab(tab) {
        selectedTab = tab.name;
        import(`./${tab.name}/${tab.component}.svelte`).then(module => {
            const Component = module.default;
            const target = document.querySelector('.container');
            target.innerHTML = '';
            new Component({ target, props: { tab } });
        });
    }

    onMount(() => {
        selectTab(tabs[0]);
    });
    
</script>

<main class="page">
    <div class="tabs">
        {#each tabs as tab}
            <button
                class="tab"
                class:active={tab.name === selectedTab}
                on:click={() => selectTab(tab)}
            >
                {tab.name}
            </button>
        {/each}
    </div>

    <div class="container">

    </div>
</main>

<style>
    .page {
        /* max-width: 900px; */
        overflow: auto;
    }
    .tabs {
        widows: 100%;
        display: flex;
        justify-content: start;
        border-bottom: 1px solid #ccc;
    }
    .tab {
        padding: 10px 20px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        color: #333;
        border-bottom: 2px solid transparent;
    }
    .tab.active {
        border-bottom: 2px solid #333;
        background-color: #ccc;
    }

    .container {
        padding: 0 1rem;
    }
</style>