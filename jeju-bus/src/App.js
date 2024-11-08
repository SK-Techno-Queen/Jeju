import React from "react";
import KakaoMap from "./JejuBus/KakaoMap";
import Table from "./JejuBus/Table";
import './App.css'; // App의 CSS 파일을 임포트

const App = () => {
  return (
    <div>
      <KakaoMap />
      <Table />
    </div>
  );
};

export default App;
