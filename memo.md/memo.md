create_sendでモナコインを送金するためのトランザクションデータを作成した

　前にできなかったやつが色々試したらできた。でもまだ送金はできない。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Html.MpurseAPI.CounterPartyAPI.CreateSend.20220928164021

## 実行

```sh
REPO=Html.MpurseAPI.CounterPartyAPI.CreateSend.20220928164021
git clone https://github.com/ytyaru/$REPO
cd $REPO/docs
./server.sh
```

　PythonでHTTPSローカルサーバを立ててMpurse APIを実行する。

## 結果

　開発者ツールのコンソールを開くと以下のような感じになる。

　以下のように[`create_send`][] APIを実行する。

[`create_send`]:https://counterparty.io/docs/api/#create_send

```javascript
const cpParams = {
    source: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    destination: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    asset: 'MONA',
    quantity: 11411400,
    memo: null,
    memo_is_hex: false,
    fee_per_kb: 10 * 1000,
    allow_unconfirmed_inputs: true,
    extended_tx_info: true,
    disable_utxo_locks: true,
};
await window.mpurse.counterParty('create_send', cpParams);
```

　その結果、以下のようなJSONが返ってくる。

```javascript
{
    "btc_change": 101556960,
    "btc_fee": 2250,
    "btc_in": 112970610,
    "btc_out": 11411400,
    "tx_hex": "0100000001737a59194d5705b49f8e7c262d97d5cfd1e31ba5f6a7590402634bcbd71c53e9010000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888acffffffff02c81fae00000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ace0a20d06000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ac00000000"
}
```

　これで送金するためのトランザクションが作成された、ということになるのだろうか？　よくわからない。

　このあと送金するためには何をどうしたらいいのだろう。たぶん`tx_hex`を使って署名したあと、サーバにブロードキャストする。そういうキーワードだけは聞きかじっているから、いかにも理解しているふうに書いているが、何をどうするかまったく理解できてない。

　とにかく今回は[`create_send`][] APIが動かせたという話。

# 経緯

* [モナコインを送金する方法を調べた][]

[モナコインを送金する方法を調べた]:https://monaledge.com/article/454

　[Mpurse][]は内部で[mpchain API][]を呼び出していた。[mpchain API][]は[counterParty API][]や[counterBlock API][]を呼び出していると思う。それを使って送金しているのだと思われる。その工程のうちのひとつに[counterParty API][]の[`create_send`][]がある。

[counterParty API]:https://counterparty.io/docs/api/
[counterBlock API]:https://counterparty.io/docs/counterblock_api/

　ブラウザでHTTPSサイトにアクセスし開発者ツールのコンソールで以下コードを実行する。

```javascript
const cpParams = {
    source: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    destination: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    asset: 'MONA',
    quantity: 0.00000000,
    memo: null,
    memo_is_hex: false,
    fee_per_kb: 0,
    allow_unconfirmed_inputs: true,
    extended_tx_info: true,
    disable_utxo_locks: true,
};
await window.mpurse.counterParty('create_send', cpParams);
//const unspentTxouts = await window.mpurse.counterParty('create_send', cpParams);
```

　以下のようなエラーが返ってきた。

```javascript
{
    "code": -32000,
    "data": {
        "args": [
            "{\"message\": \"Error composing send transaction via API: Destination output is dust.\", \"code\": -32001}"
        ],
        "message": "{\"message\": \"Error composing send transaction via API: Destination output is dust.\", \"code\": -32001}",
        "type": "Exception"
    },
    "message": "Server error"
}
```

　以下のようなコメントをいただいた。

> トランザクションを作成する機能は counterparty-server 側の API にあります。counterblock にはありません。 API で無事トランザクションが生成されても無署名なのでブロックチェーンに投げ込んでも、無効扱いされ、手持ちの MONA は消えません。秘密鍵による署名が完了するまでは気軽に試しても問題ありません。testnet の API は存在しますが、testnet の MONA の入手は難しく、mainnet で試したほうが手間が少ないと思います。

　[`create_send`][]しても手持ちのモナコインが減ることはない。だから好きなだけ[`create_send`][]で動作確認すればいい。そういう意味だと捉えた。

　前回はそれ以来なにもしてなかったが、今回いろいろ々試して成功した。

# 試行錯誤ログ

　蛇足。試行錯誤したときのメモをほぼそのまま書いてあるのでまとまってない。

## 気づいたこと

　前回のJSON結果を改めて読み直すといくつか気づいたことがあった。

* `Destination output is dust`
	* `quantity: 0.00000000,`
	* `fee_per_kb: 0,`

　エラーメッセージによると「出力がゴミ」と言ってる。何のことだかよくわからないがググってみると手数料が少なすぎるせいらしい。`fee_per_kb`の値を上げたらいいのでは？　でも出力ってたぶん`quantity`のことでは？　そっちを上げるべきか？　いずれにせよどちらも`0`なのが悪いのでは？　署名してないから手持ちのモナが減ることはないらしいので、安心してテストできるはず。色々数値を変えて試してみよう。

　また、`quantity`は少数値でなく整数値で入力するのが正しい気がする。以前トランザクションデータのどこかでそんなのを見た。つまり最小値`0.00000001 MONA`＝`quantity: 1`で表す。[counterParty API][]の[`create_send`][]をみてみると引数説明のところに[quantities-and-balances][]リンクがあって、そこに書いてあった。

[quantities-and-balances]:https://counterparty.io/docs/api/#quantities-and-balances

## 試してみた

　以下2点を改善して実行してみたら成功した！

* `quantity`: `11411400`（`0.11411400 MONA`）
* `fee_per_kb`: `10`（Mpurseで設定できる最小値と同じ？）

```javascript
const cpParams = {
    source: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    destination: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    asset: 'MONA',
    quantity: 11411400,
    memo: null,
    memo_is_hex: false,
    fee_per_kb: 10,
    allow_unconfirmed_inputs: true,
    extended_tx_info: true,
    disable_utxo_locks: true,
};
await window.mpurse.counterParty('create_send', cpParams);
```
```javascript
{
    "btc_change": 101559208,
    "btc_fee": 2,
    "btc_in": 112970610,
    "btc_out": 11411400,
    "tx_hex": "0100000001737a59194d5705b49f8e7c262d97d5cfd1e31ba5f6a7590402634bcbd71c53e9010000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888acffffffff02c81fae00000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888aca8ab0d06000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ac00000000"
}
```

　ちなみに`quantity`が`1`や`1000`だと`Destination output is dust`エラーになった。`0.00001000 MONA`でもダメらしい。最小値`0.00000001 MONA`を支払額にすることはできないようだ。なんてこったorz。使える最少額っていくらなんだろう。そこまで細かくは調べなかった。成功した
`11411400`以下で、かつ失敗した`1000`より大きい値なのだろう。

## 出力結果の解析

　この出力結果おかしくない？　まず`btc`ってビットコインのことだと思う。モナコインなんですけど？　`asset: 'MONA',`で指定したんですけど？

　あと`btc_fee`が`2`だったら`btc_in`は`11411402`になるんじゃないの？　`112970610`が送金額`11411400`の10倍以上なんですけど。これって送金者が`112970610`出して支払先アドレスに`11411400`だけ支払ったあと、残った`101559210`と手数料`2`の合計`101559212`は全額マイナーにトランザクション承認処理のインセンティブとして支払われちゃうのでは？　（※ちがう。後述するが`btc_change`をみてない）　さすがに大金すぎない？　Mpurseの手数料はそんなにバカ高くなかったはず。

　考えられる可能性としては以下２つ。

* 私の読み方がまちがっている
* 手数料の設定にコツがいる

　Mpurseのソースコード[send.component.ts#L301][]を読んでみた。手数料を設定しているのは以下の部分。

[send.component.ts#L301]:https://github.com/tadajam/mpurse/blob/851bf8fd1db5ae8094caeb304881caea20a11649/src/app/components/send/send.component.ts#L301

```javascript
new Decimal(this.feeControl.value)
.times(new Decimal(1000))
.toNumber(),
```

* `this.feeControl.value`はMpurseのUIにある手数料を決めるスライダーの値。デフォルトは`101`で最小`10`になるやつ
* `Decimal`は正確な浮動小数点で計算するための外部ライブラリだと思う
* `Decimal.times()`は乗算。つまり`101`などの値を`1000`倍している
* `Decimal.toNumber()`で数値化する

　`Decimal`の情報源は以下。

* [JavaScriptで小数の計算(decimal.js)][]
* [decimal.js][]

[JavaScriptで小数の計算(decimal.js)]:https://taitan916.info/blog/archives/2997
[decimal.js]:https://mikemcl.github.io/decimal.js/

　というわけで、Mpurseに出てくる手数料`101`の最小値`10`を`1000`倍してみる。

```javascript
const cpParams = {
    source: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    destination: 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu',
    asset: 'MONA',
    quantity: 11411400,
    memo: null,
    memo_is_hex: false,
    fee_per_kb: 10 * 1000,
    allow_unconfirmed_inputs: true,
    extended_tx_info: true,
    disable_utxo_locks: true,
};
await window.mpurse.counterParty('create_send', cpParams);
```
```javascript
{
    "btc_change": 101556960,
    "btc_fee": 2250,
    "btc_in": 112970610,
    "btc_out": 11411400,
    "tx_hex": "0100000001737a59194d5705b49f8e7c262d97d5cfd1e31ba5f6a7590402634bcbd71c53e9010000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888acffffffff02c81fae00000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ace0a20d06000000001976a91445fc13c9d3a0df34008291492c39e0efcdd220b888ac00000000"
}
```

　お、`btc_fee`の値が`2250`になった。これはMpurseの手数料スライダーで`10`にしたとき表示される`0.00002250 MONA`の整数値版`2250`と一致する。

　それはいいのだが、`btc_in`がおかしくない？　入力`in`は出力`out`と手数料`fee`の合計以上になる値だと思うのだけど。つまり`11411400 + 2250`で`11413650`となり、それ以上の額を入力`in`として指定するのが正しいのでは？（※まだ勘違いしてる）

```
out + fee <= in
11411400 + 2250 = 11413650 <= in
```

　と思ったのだが、`btc_change`とかいう謎の値がかかわっているっぽいことに気づいた。

```
btc_change = btc_in - (btc_out + btc_fee)
101556960 = 112970610 - (11411400 + 2250)
```

　いや、謎じゃなかった。`btc_change`は「おつり」のことだった。英語でおつりのことを`change`というらしい。そして計算してもその意味として理解できる。

　でも、なぜ`btc_in`をそんな巨額にする必要があるのかわからない。`11411400 + 2250`で`11413650`となり、おつりゼロのほうがよいのでは？　そもそも`btc_in`の`112970610`という値はどこからやってきたの？　それを計算するための引数があるのかな？　

　引数`disable_utxo_locks`が関係しているかとあたりをつけた。これだけがよくわからないし変数になってたので思って調べた。[Mpurseのソースコードから`disableUtxoLocks`で検索][sesarch disableUtxoLocks][]してコードを色々と眺めてみた。

　`create_send`するときは`true`であり、[mpchain API][]で`send_tx`するときは`false`らしい。ええと、UTXOは未使用トランザクションのことで、そのロックを無効化するフラグが`true`ってことは、`create_send`するときは未使用トランザクションのロックを無効化するってことか。で、未使用トランザクションのロックって何？

[sesarch disableUtxoLocks]:https://github.com/tadajam/mpurse/search?q=disableUtxoLocks

　よくわかんない。まあいいや。とにかく[`create_send`][]できた。

# 所感

　[`create_send`][]までできたのはいいとして、このあとどうしたら送金できるのか。まだまだ先は長そう。

