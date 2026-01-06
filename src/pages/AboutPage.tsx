import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">このアプリについて</h3>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">アプリケーション名</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Excel Transfer & PCS Daily Generator</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">概要</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              月次レポートからPCSデータを抽出し、日次差分を計算してテンプレートへ転記するツールです。
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">プライバシーとセキュリティ</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              本アプリケーションはGitHub Pages上で動作する静的サイト（クライアントサイドのみ）です。<br/>
              アップロードされたExcelファイルはブラウザ内でのみ処理され、外部サーバーへ送信・保存されることは一切ありません。<br/>
              安心してご利用ください。
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default AboutPage;
