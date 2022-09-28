window.addEventListener('DOMContentLoaded', async(event) => {
    console.log('DOMContentLoaded!!');
    const cpParams = {
        source: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu', // 送金元
        destination: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu', // 宛先
        asset: 'MONA',
        quantity: 11411400, // 0.11411400 MONA
        memo: null,
        memo_is_hex: false,
        fee_per_kb: 10 * 1000, // Mpurseでいう10〜200(初期値101)に1000を掛ける
        allow_unconfirmed_inputs: true,
        extended_tx_info: true,
        disable_utxo_locks: true, // Mpurse が mpchain APIで send_tx するときは false にしてた
    };
    console.log(`await window.mpurse.counterParty('create_send', cpParams)`)
    console.log(`cpParams:`, cpParams)
    const unspentTxouts = await window.mpurse.counterParty('create_send', cpParams);
    console.log(`res:`, unspentTxouts)
});
window.addEventListener('beforeunload', async(event) => {
    console.log('beforeunload!!');
});

