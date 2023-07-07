# Batocera.linux Webフロントエンド開発支援プロクシ

[Batocera.linux](https://batocera.org/)のWebフロントエンドはあまり手を入れられていない分野ではありますが、  
ソースが[EmulationStation](https://github.com/NullPopPoLab/batocera-emulationstation/branches)に組み込まれていて書き換え(というかビルド)の敷居が高いため  
手を入れることすら困難といった問題があります。  
むかーしはHTMLだけローカルに拾ってくれば済む話だったんだけど、最近のブラウザって  
セキュリティに過敏でどーでもいーとこまでいぢわるなんだもん。  

というわけで、BatoceraのWebAPIを呼び出すだけのプロクシを組んでみました。  
[NullPopPoCustom](https://github.com/NullPopPoLab/batocera.linux/wiki)用に機能整備されたものですが、本家Batoceraでも互換性のある部分は  
だいたい動作確認できてます。ただしジャンル選択については本家でもいろいろと  
挙動怪しげな部分あるので完全対応というわけにもいかないんだこれ。  

で、NullPopPoCustomではとりあえず思い付きの機能入れるだけ入れてみたですが、  
いろいろとイケてないところもありまして、改善いただけたら嬉しいなっと。  

## ファイル構成 

- fe/*: フロントエンドで扱うファイル群
- config.template.json: 設定類のテンプレート
- package.json: Node.js依存パッケージ
- proxy.js: プロクシソース
- README.md: 今読んでるやつ
- setpath.template.bat: Node.jsインストールpath設定のテンプレート
- shell.bat: シェルだけ起動したいときのbat
- start.bat: プロクシ起動用bat
- stop.bat: プロクシ終了用bat

## 準備

まず[Node.js](https://nodejs.org/)を調達よろし。  
対応バージョンは知らんけど、とりあえずウチは18.12.1 Windows64bit版で動作確認した。  

で、Windowsでは setpath.template.bat のコピーから start.bat を作成して、  
そこで各自の環境に合わせて  
path C:\NodeJS;%PATH%
な感じでNode.jsのインストールpathを設定します。  
Windows以外ではこれも含め、 *.bat に相当するスクリプトを移植して  
これを代替手順とします。  

なお、既定ではWeb APIが無効になっているので  
EmulationStationのMAIN MENU > SYSTEM SETTINGS > DEVELOPER > ENABLE PUBLIC WEB ACCESS  
をonにすると有効になりますが、ここで要注意点としてWeb APIは認証もなく  
脆弱性度外視な仕様なので、Batoceraが稼働している端末のTCPポート1234は  
絶っっっっっっっっ対にインターネット公開にしてはいけません。  
遠隔操作され放題になりますよっと。  

さて、プロクシの設定に戻るとしまして、  
config.template.json のコピーから config.json を作成して、 
そこで各自の環境に合わせて  
APIBaseに http://Batocera端末のローカルIP:1234 な形で接続先を設定します。  
(このURLを普通にwebブラウザで覗くとビルドされたフロントエンドが始まるはず)  
ListeningPortにはプロクシで使うTCPポート番号を決めます。  

## 使い方

準備できたら、Windowsでは start.bat で起動、stop.batで終了。  
Windows以外では代替手順で。  
そして proxy.js が実行されたところで、webブラウザから  
http://localhost:さっき設定したポート番号  
でプロクシ側のフロントエンドが起動されたら成功。  

プロクシ側フロントエンドのソースは  
fe/resources/services/index.html  
にあります。  
ちょっと変則的ですが、プロクシはEmulationStationの仕様に合わせ  
/resources/* へのアクセスが fe/resources/* を参照し  
/* へのアクセスが fe/resources/services/* を参照し  
該当ファイルがどちらにもないときBatocera側へのアクセスを試みます。  

というわけで、フロントエンドで使うファイルは fe/ 内の  
所定の位置に置いていきます。  

## WebAPI解説

### GET /caps
(NullPopPoCustom拡張)  
拡張機能の対応状況をJSONにて取得します。  
このため、フロントエンドでは最初に呼ぶべきAPIとなります。  
本家Batoceraにはない機能なので、ステータス404が返ってきたときは  
本家版であることを前提として既定値を設定しておきます。  

- Version: バージョン文字列
- Documentation: ドキュメント情報に対応
- GetScraperMedia: メディア置き場内参照可
- GetScreenshot: スクリーンショット取得可
- JukeBox: ジュークボックス機能に対応
- RemoveMedia: メディアファイルの削除に対応
- SaveGenreByIDs: ジャンル情報をジャンルIDで保存する
- SlideShow: スライドショー機能に対応
- SortName: ソート用名称に対応
- StrictTitle: 厳密なタイトル名称を別途保持
- GenreLanguages: ジャンル表示に対応する言語コードと表示名の辞書
- Flags: 対応するフラグ系MetaDataのキー名と表示名の辞書
- Texts: 対応するスクロール文書系MetaDataのキー名と表示名の辞書
- Books: 対応するブック文書系MetaDataのキー名と表示名の辞書
- Videos: 対応する動画系MetaDataのキー名と表示名の辞書
- Images: 対応する静止画系MetaDataのキー名と表示名の辞書

### GET /restart
### GET /quit
(本家互換)  
どちらも、EmulationStationを再起動します。  
ゲーム実行中のときは、ゲーム終了後に処理されます。  
後者はEmulationStation終了を想定したものみたいですが、  
Batoceraでは結局再起動されます。  

### GET /emukill
(本家互換)  
実行中のゲームを強制終了します。  

### GET /reloadgames
(本家互換)  
ゲーム一覧を現状に更新します。  

### POST /notify
(本家互換)  
POST bodyにUTF-8文字列を添え、EmulationStationにポップアップ通知を表示します。  
こちらは改行不可。  
ゲーム実行中のときは、ゲーム終了後に処理されます。  

### POST /messagebox
(本家互換)  
POST bodyにUTF-8文字列を添え、EmulationStationにダイアログ通知を表示します。  
こちらは改行可。  
ゲーム実行中のときは、ゲーム終了後に処理されます。  

### POST /launch
(本家互換)  
POST bodyにゲームのインストールpathを添え、対象ゲームを実行します。  
GAME SETTINGS > CHECK BIOS FILES BEFORE RUNNING A GAME  
が有効になっているとダイアログに阻まれることがあるので無効化推奨。  
ゲーム実行中のときは、ゲーム終了後に処理されます。  

### GET /runningGame
(本家互換)  
実行中のゲーム情報をJSONにて取得します。  
ゲームが実行されていないとき、 Batocera34まではステータス404、  
Batocera35からはステータス201が返ってくるようです。  
以下、未設定の項目は含まれないのでそれぞれ既定値として扱う必要があります。  

- id: ゲームID
- path: ゲームのインストールpath
- name: ゲームの表示名
- systemName: システムキー名
- title: (NullPopPoCustom拡張) 厳密なタイトル名
- sortname: (NullPopPoCustom拡張 というか本家で封印されてたやつ復活) ソート用名称
- family: ゲームシリーズ名
- desc: ゲーム概要
- rating: 1.0を満点とした評価値
- runnable: (NullPopPoCustom拡張) ゲーム開始可能であることを示す
- favorite: お気に入り登録されていることを示す
- hidden: ゲーム一覧から隠されていることを示す
- kidgame: KIDモードUIでのゲーム一覧に含まれることを示す
- region: 頒布国コード
- lang: 対応言語コード
  - …らしいけど、DLCでは国コードが設定されていたりする
- releasedate: 発売日 (ISO8601表記)
- developer: 開発元
- publisher: 発売元
- arcadesystem: アーケードシステム名
  - NullPopPoCustomではアーケード以外でもこれに準じる何かとしてディスクシステムとかスーファミターボとかで流用想定
- genre: 英語表記でのジャンル群
  - 本家では、この値でゲーム一覧に保存される
    - しかしフォーマット不定な問題あって正常動作させようなさげ
- genres: ジャンルIDでのジャンル群
  - 複数のジャンルは , 区切りで示す
  - NullPopPoCustomでは、この値でゲーム一覧に保存される
- players: プレイヤー人数
  - 本家では、整数しか書き込めない
  - NullPopPoCustomでは文字列で書き込めるので、2人対戦と2人協力を区別できたりする
- premise: (NullPopPoCustom拡張) 前提事項
- story: (NullPopPoCustom拡張) ストーリー
- rule: (NullPopPoCustom拡張) ゲームルール
- operation: (NullPopPoCustom拡張) 操作説明
- credit: (NullPopPoCustom拡張) クレジット
- tips: (NullPopPoCustom拡張) 有用な情報群
- notes: (NullPopPoCustom拡張) 雑多な情報群
- bugs: (NullPopPoCustom拡張) バグ情報群
- manual: 取扱説明書
- magazine: 雑誌記事
- video: 動画path
- thumbnail: サムネイル画像path
  - 本家BatoceraではBox扱いになっている
- image: 雑多な画像path
  - EmulationStationでサムネイル扱いになる方
- titleshot: タイトル画像path
- ingame: (NullPopPoCustom拡張) インゲーム画像path
- outgame: (NullPopPoCustom拡張) アウトゲーム画像path
- visual: (NullPopPoCustom拡張) ビジュアルシーン画像path
- bezel: ベゼル画像path
- marquee: ロゴ画像path
- boxart: パッケージ表画像path
  - 本家BatoceraではAlt Box扱いになっている
- boxback: パッケージ裏画像path
- cartridge: カートリッジ画像path
- pcb: (NullPopPoCustom拡張) 基板画像path
- flyer: (NullPopPoCustom拡張) 広告画像path
- wheel: (用途不明)画像path
- fanart: ファンアート画像path
- mix: 雑多な画像path
  - EmulationStationで扱われない方
- map: マップ画像path
  - 静止画系だが、特例で .pdf .cbz にも対応しているらしい。
- playcount: プレイ回数
- lastplayed: 前回実行日時 (ISO8601表記)
- gametime: 総プレイ秒数
- docsAvailable: (NullPopPoCustom拡張) ゲーム毎scraperディレクトリにdocs.jsonがある
- slideshowAvailable: (NullPopPoCustom拡張) ゲーム毎scraperディレクトリにslideshowディレクトリがある
- jukeboxAvailable: (NullPopPoCustom拡張) ゲーム毎scraperディレクトリにjukeboxディレクトリがある

### GET /systems
(本家互換)  
ゲームがインストールされている全ての機種やコレクションの情報をJSON配列で取得します。  

### GET /systems/システムキー名
(本家互換)  
ゲームがインストールされている特定の機種やコレクションの情報をJSON配列で取得します。  
インストールされていないシステムキー名を指定してもステータス404が返ってきます。  

- name: システムキー名
- fullname: システム表示名
- hardwareType: ハードウェア分類名
  - 厳密すぎると分類が細かくなりすぎてUIの操作性に悪影響を及ぼすため、NullPopPoCustomでは適当にまとめている。
- manufacturer: 製造元分類名
  - 厳密すぎると分類が細かくなりすぎてUIの操作性に悪影響を及ぼすため、NullPopPoCustomでは適当にまとめている。
- releaseYear: 発売年
- theme: テーマ名 (未詳)
- extensions: 認識対象拡張子群配列
- visible: 一覧表示対象とする
- group: グループ統合先
- collection: コレクションであることを示す
- gamesystem: ゲーム群であることを示す
  - スクリーンショットも含まれる
- groupsystem: グループであることを示す
  - msx,nesなど複数のシステムが統合されたもの
- visibleGames: 一覧表示対象のゲーム本数
- favoritedGames: お気に入り登録されたゲーム本数
- playedGames: 起動済ゲーム本数
- hiddenGames: 一覧から隠されたゲーム本数
- mostPlayedGame: 最も遊ばれているゲーム表示名
- logo: ロゴ画像path

### GET /systems/システムキー名/logo
(本家互換)  
対象システムのロゴ画像を取得します。  

### GET /systems/システムキー名/games
(本家互換)  
対象システムに属するゲーム群の情報をJSON配列で取得します。  

### GET /systems/システムキー名/games/ゲームID
(本家互換)  
対象ゲームの情報をJSONにて取得します。  
(内容は /runningGame と同じ)

### POST /systems/システムキー名/games/ゲームID
(本家互換)  
POST bodyにJSONを添え、対象ゲームの情報を書き換えます。  
(書き換え不可項目は無視されます)  

### GET /systems/システムキー名/games/ゲームID/media/メディアキー名
(本家互換)  
対象ゲームのメディアデータを取得します。  

### POST /systems/システムキー名/games/ゲームID/media/メディアキー名
(本家互換)  
POST bodyにデータファイル内容を添え、対象ゲームのメディアデータを書き換えます。  

### POST /systems/システムキー名/games/ゲームID/remove_media/メディアキー名
(NullPopPoCustom拡張)  
対象ゲームのメディアデータを削除します。  

### GET /systems/システムキー名/games/ゲームID/scraper/データpath
(NullPopPoCustom拡張)  
対象ゲームのメディア置き場から相対pathでデータを取得します。  
pathがディレクトリであるときは、ディレクトリ内のファイルやディレクトリ群をJSONにて取得します。  

### POST /addgames
(本家互換)  
POST bodyにJSONを添え、ゲーム一覧に追加するらしい(未詳)  

### POST /removegames
(本家互換)  
POST bodyにJSONを添え、ゲーム一覧から削除するらしい(未詳)  

### GET /screenshots/ファイル名
(NullPopPoCustom拡張)  
スクリーンショットから画像データを取得します。  


## 諸機能補足

### ゲームグループ
ゲームのインストール先は /userdata/roms/システムキー名/ 内ですが、  
この中にディレクトリを置くとそれがゲームグループとしてまとまった扱いになります。  
- 1ゲームが複数のファイルで構成されているのをまとめる
- 複数のゲームに同じ設定をまとめて適用する
といった効果があります。  

### 厳密なタイトル名
(NullPopPoCustom拡張)  
厳密なタイトル名を普通に書くと長すぎてUIで途切れて判別不能になったり  
といった問題があり、この対策のため厳密なタイトル表記は別枠で持ち、  
通常の名前にはUIで表示するための簡潔な表現を用意します。  

### ソート用名称
(NullPopPoCustom拡張)  
普通に名前でソートすると漢字が後ろに回ったりナンバリングぐちゃぐちゃになったり  
といった問題があり、この対策のためソート専用の名称定義を用意し  
- 英大文字,数字,濁点抜きひらがなだけ
- ナンバリングタイトルの1作目には 1 を付ける
  - 2桁以上のナンバリングがあるものは桁数を合わせる
- 非ナンバリングサフィクスは - または ~ で区切る
  - ナンバリングタイトル群の前に置きたいか後ろに置きたいかで使い分けられる
- シリーズの先頭側に差し込まれた表記は後ろに回してサフィクス同様の扱い
- '80 といった2桁年表記は4桁年表示に変更
  - ナンバリングタイトルと混在しているものは # または @ を前置することで並びを制御できる

といったルールで記述します。  
なお、定義のないものは通常の表示名でソートされます。  

### Runnable フラグ
(NullPopPoCustom拡張)  
起動成功したものに印をつけておく、ただそれだけの存在。  

### Favorite フラグ
お気に入り抽出、ただそれだけの存在。  

### Hidden フラグ
一覧から消す、ただそれだけの存在。  

### Kid Game フラグ
EmulationStationのUI設定にはKIDモードがあり、ゲーム一覧への表示対象を  
ホワイトリストで限定することができます。  
このフラグをonにしたものだけがその表示対象となります。  
早い話がペアレンタルコントロール用。  

### スクロール文書系
単なる改行可文字列。  

### ブック文書系
PDFまたはCBZ形式の文書ファイルで扱います。  

### 動画系
EmulationStationでは .mp4 .avi .mkv .webm が認識される。  
webブラウザで使えるかはまた別の話。  

### 静止画系
EmulationStationでは .jpg .png .gif が認識される。  
webブラウザで使えるかはまた別の話。  

### メディア置き場
本家Batoceraでは、 /userdata/roms/システムキー名/ 内に置かれます。  
NullPopPoCustomでは、 /userdata/scraper/システムキー名/ゲームグループ名/ 内に置かれます。  

### ドキュメント情報
(NullPopPoCustom拡張)  
メディア置き場直下に docs.json を置くと、表示名とリンク先の辞書からなる  
ドキュメントリンク集として扱われます。  
リンク先に : が含まれるものはwebリンクとして扱い、  
ないものはメディア置き場の相対pathとして扱われます。  

### ジュークボックス機能
(NullPopPoCustom拡張)  
メディア置き場直下に jukebox ディレクトリを置くと、  
その中の音楽ファイルを再生対象として取得できます。  

### スライドショー機能
(NullPopPoCustom拡張)  
メディア置き場直下に slideshow ディレクトリを置くと、  
その中の画像ファイルを再生対象として取得できます。  
