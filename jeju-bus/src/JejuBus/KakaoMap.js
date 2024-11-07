import React, { useEffect, useState } from 'react';
import './KakaoMap.css'; // CSS 파일 import

const KakaoMap = () => {
  const [buses, setBuses] = useState([]); // 버스 데이터를 저장할 상태

  // 백엔드에서 버스 데이터를 주기적으로 가져오는 함수
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8080/bus'); // 백엔드 API 호출
      const data = await response.json();
      console.log(data); // 데이터를 확인하기 위한 로그
      setBuses(data); // 데이터를 상태에 저장
    } catch (error) {
      console.error('버스 데이터를 가져오는 데 실패했습니다:', error);
    }
  };

  useEffect(() => {
    fetchData(); // 컴포넌트가 처음 렌더링될 때 데이터 가져오기

    // 데이터를 주기적으로 업데이트
    const interval = setInterval(fetchData, 5000); // 5초마다 데이터 갱신

    // 클린업: 컴포넌트가 언마운트될 때 interval을 정리
    return () => clearInterval(interval);
  }, []); // 최초 렌더링 시 한 번만 실행

  useEffect(() => {
    if (buses.length === 0) return; // 버스 데이터가 없으면 실행하지 않음

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      const { kakao } = window;

      // 카카오맵 API가 제대로 로드되었는지 확인
      if (!kakao || !kakao.maps) {
        console.error('카카오맵 API가 제대로 로드되지 않았습니다.');
        return;
      }

      // 카카오맵 API 로드 후 실행
      kakao.maps.load(() => {
        const container = document.getElementById('map');
        // const firstBus = buses[0]; // 첫 번째 버스를 중심으로 지도 설정
        const options = {
        //   center: new kakao.maps.LatLng(firstBus.localY, firstBus.localX), // 버스를 중심으로 지도 설정
            // center: new kakao.maps.LatLng(33.36167, 126.52917), // 한라산 국립공원을 중심으로 지도 설정
            center: new kakao.maps.LatLng(33.500082, 126.514742), // 제주 버스터미널을 중심으로 지도 설정
          level: 5, // 줌 레벨
        };

        const map = new kakao.maps.Map(container, options); // 지도 객체 생성

        // 마커 배열을 저장할 변수
        const markers = [];

        // 각 버스에 대해 마커 생성
        buses.forEach(bus => {
          const markerPosition = new kakao.maps.LatLng(bus.localY, bus.localX); // 각 버스의 위도, 경도 사용
          const marker = new kakao.maps.Marker({
            position: markerPosition,
          });

          // 마커를 배열에 추가
          markers.push(marker);

          // 지도에 마커 표시
          marker.setMap(map);
        });

        // 마커 업데이트를 위해 클린업 함수 추가
        return () => {
          markers.forEach(marker => marker.setMap(null)); // 이전 마커 제거
        };
      });
    };

    document.head.appendChild(script); // 스크립트 로드

    // 클린업: 컴포넌트가 언마운트 될 때 스크립트 제거
    return () => {
      document.head.removeChild(script);
    };
  }, [buses]); // buses 데이터가 변경될 때마다 실행

  return (
    <div className="map-container">
      <div id="map"></div>
    </div>
  );
};

export default KakaoMap;
