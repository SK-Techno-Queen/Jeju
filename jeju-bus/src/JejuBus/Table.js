import React, { useState, useEffect } from 'react';
import './Table.css'; // table.css 파일을 임포트

const Table = () => {
  // 좌표 히스토리를 상태로 관리, 각 버스에 대해 timestamp, prevTimestamp, timeDiff를 관리
  const [coordinateHistory, setCoordinateHistory] = useState({
    제주79자7117: { timestamp: null, prevTimestamp: null, timeDiff: 0 },
    제주79자7122: { timestamp: null, prevTimestamp: null, timeDiff: 0 },
    제주79자7111: { timestamp: null, prevTimestamp: null, timeDiff: 0 },
  });

  // 타임스탬프 차이 계산 함수 (초 단위)
  const calculateTimeDifference = (busId, currentTimestamp) => {
    const prevTimestamp = coordinateHistory[busId].timestamp; // 이전 타임스탬프 가져오기
    if (!prevTimestamp) return 0; // 이전 타임스탬프가 없다면 차이는 0
    const diffInMilliseconds = currentTimestamp - prevTimestamp; // 밀리초 단위 차이 계산
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000); // 밀리초를 초 단위로 변환
    return diffInSeconds;
  };

  // 실시간으로 버스 정보 받아오기
  const fetchBusData = async () => {
    try {
      const response = await fetch('http://localhost:8080/bus'); // /bus API 호출
      const data = await response.json(); // JSON 형식으로 응답 받기

      data.forEach((bus) => {
        const busId = bus.plateNo;  // plateNo를 버스 ID로 사용
        const timestamp = new Date(bus.timestamp);  // timestamp를 Date 객체로 변환
        const timeDiff = calculateTimeDifference(busId, timestamp); // 타임스탬프 차이 계산

        // 새로운 기록 추가
        setCoordinateHistory((prev) => ({
          ...prev, // 기존 데이터를 유지하면서 새로운 데이터 업데이트
          [busId]: {
            timestamp, // 새로운 타임스탬프
            prevTimestamp: timestamp, // 새로운 타임스탬프를 prevTimestamp로 설정
            timeDiff, // 계산된 타임스탬프 차이
          },
        }));
      });
    } catch (error) {
      console.error("Error fetching bus data:", error); // API 호출 중 에러 처리
    }
  };

  // 컴포넌트가 마운트될 때마다 2초마다 API 호출하여 버스 데이터 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBusData(); // 2초마다 버스 데이터 갱신
    }, 2000);

    return () => clearInterval(interval); // 컴포넌트가 unmount될 때 interval 종료
  }, []); // 빈 배열을 전달하여 컴포넌트가 마운트될 때 한 번만 실행

  return (
    <div className="data-panel">
      <table className="coordinate-table">
        <thead>
          <tr>
            <th>Bus Plate Number</th> {/* 버스 번호 열 */}
            <th>Original Timestamp</th> {/* 오리지널 타임스탬프 열 */}
            <th>Filtered Timestamp</th> {/* 필터링된 타임스탬프 열 (추후 추가 예정) */}
            <th>Timestamp Difference (s)</th> {/* 타임스탬프 차이 (초 단위) 열 */}
          </tr>
        </thead>
        <tbody>
          {/* 고정된 버스 번호 목록에 대해 테이블 행을 생성 */}
          {['제주79자7117', '제주79자7122', '제주79자7111'].map((busId) => (
            <tr key={busId}>
              <td>{busId}</td> {/* 버스 번호 출력 */}
              <td>{coordinateHistory[busId].timestamp ? coordinateHistory[busId].timestamp.toLocaleString() : '-'}</td> {/* 오리지널 타임스탬프 출력 (없으면 '-' 표시) */}
              <td>-</td> {/* 필터링된 타임스탬프는 나중에 추가 */}
              <td>{coordinateHistory[busId].timeDiff}</td> {/* 타임스탬프 차이 출력 */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
