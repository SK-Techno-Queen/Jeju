import React, { useEffect, useState } from 'react';
import './KakaoMap.css';

const KakaoMap = () => {
  // 버스 데이터를 저장할 상태 변수
  const [buses, setBuses] = useState([]);
  // 관광지 데이터를 저장할 상태 변수
  const [spots, setSpots] = useState([]);
  // 카카오맵 객체를 저장할 상태 변수
  const [map, setMap] = useState(null);
  // 마커들을 저장할 상태 변수
  const [markers, setMarkers] = useState([]);

  // 백엔드에서 버스 데이터를 주기적으로 가져오는 함수
  const fetchBusData = async () => {
    try {
      const response = await fetch('http://localhost:8080/bus'); // 백엔드 API 호출
      const data = await response.json(); // JSON 형식으로 응답 데이터 파싱
      console.log("받은 버스 데이터:", data); // 받은 데이터를 콘솔로 출력
      setBuses(data); // 받은 데이터를 상태 변수에 저장
    } catch (error) {
      console.error('버스 데이터를 가져오는 데 실패했습니다:', error); // 에러가 발생하면 콘솔에 출력
    }
  };

  // 백엔드에서 관광지 데이터를 가져오는 함수
  const fetchSpotData = async () => {
    try {
      const response = await fetch('http://localhost:8080/spot'); // 백엔드 API 호출
      const data = await response.json(); // JSON 형식으로 응답 데이터 파싱
      console.log("받은 관광지 데이터:", data); // 받은 데이터를 콘솔로 출력
      setSpots(data.items || []); // 받은 데이터를 상태 변수에 저장
    } catch (error) {
      console.error('관광지 데이터를 가져오는 데 실패했습니다:', error); // 에러가 발생하면 콘솔에 출력
    }
  };

  // 카카오맵 API를 로드하고, 맵을 설정하는 useEffect
  useEffect(() => {
    // 카카오맵 API 스크립트를 동적으로 로드
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false`;
    script.async = true;

    // 스크립트가 로드되었을 때 실행될 콜백 함수
    script.onload = () => {
      // 카카오맵 객체를 window에서 가져옴
      const kakao = window.kakao;

      if (!kakao || !kakao.maps) {
        console.error('카카오맵 API가 로드되지 않았습니다.'); // 카카오맵 API가 로드되지 않으면 에러 메시지 출력
        return;
      }

      // 카카오맵이 로드되면 지도 생성
      kakao.maps.load(() => {
        const container = document.getElementById('map'); // 지도를 렌더링할 DOM 요소
        const options = {
          center: new kakao.maps.LatLng(33.36167, 126.52917), // 지도 초기 중심 위치 설정 (한라산 국립공원)
          level: 9, // 초기 줌 레벨 설정
        };

        const createdMap = new kakao.maps.Map(container, options); // 지도 객체 생성
        setMap(createdMap); // 생성된 지도 객체를 상태에 저장
      });
    };

    document.head.appendChild(script); // HTML 문서의 head에 스크립트를 추가하여 로드

    // 컴포넌트 언마운트 시 스크립트를 제거하는 클린업 함수
    return () => {
      document.head.removeChild(script);
    };
  }, []); // 컴포넌트가 처음 렌더링될 때만 실행

  // 버스와 관광지 데이터, 지도 객체가 변경될 때마다 마커를 업데이트하는 useEffect
  useEffect(() => {
    // 지도 객체가 없거나 버스/관광지 데이터가 없으면 마커 업데이트를 하지 않음
    if (!map || (buses.length === 0 && spots.length === 0)) return;

    const { kakao } = window; // 카카오맵 객체 가져오기

    // 이전에 표시된 마커들을 제거
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    // 버스 마커 생성
    buses.forEach(bus => {
      const markerPosition = new kakao.maps.LatLng(bus.localY, bus.localX); // 각 버스의 위도, 경도로 마커 위치 설정
      const marker = new kakao.maps.Marker({ position: markerPosition }); // 마커 생성
      marker.setMap(map); // 생성된 마커를 지도에 추가
      newMarkers.push(marker); // 마커 배열에 추가
    });

    // 기본 마커 설정 (관광지용)
    const spotImageSrc = '/location.png'; // 기본 관광지 마커 이미지
    const spotImageSize = new kakao.maps.Size(32, 35); // 마커 이미지 크기
    const spotImageOption = { offset: new kakao.maps.Point(16, 35) }; // 마커 이미지의 기준점 설정
    const spotMarkerImage = new kakao.maps.MarkerImage(spotImageSrc, spotImageSize, spotImageOption); // 마커 이미지 객체 생성

    // 관광지 마커 생성 (이미지 적용)
    spots.forEach(spot => {
      const markerPosition = new kakao.maps.LatLng(spot.latitude, spot.longitude); // 관광지 위치 좌표
      const marker = new kakao.maps.Marker({
        position: markerPosition, // 마커 위치
        image: spotMarkerImage, // 관광지 마커 이미지 적용
      });
      marker.setMap(map); // 생성된 마커를 지도에 추가
      newMarkers.push(marker); // 마커 배열에 추가
    });

    setMarkers(newMarkers); // 새로운 마커 배열을 상태에 저장

  }, [buses, spots, map]); // buses, spots, map 상태가 변경될 때마다 실행

  // 주기적으로 버스 데이터를 가져오는 useEffect
  useEffect(() => {
    fetchBusData(); // 컴포넌트가 처음 렌더링될 때 데이터 가져오기
    const interval = setInterval(() => {
      fetchBusData(); // 5초마다 버스 데이터 갱신
    }, 5000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 interval 클리어
  }, []); // 최초 렌더링 시 한 번만 실행

  // 관광지 데이터는 한 번만 가져오기
  useEffect(() => {
    fetchSpotData(); // 최초 렌더링 시 한 번만 호출
  }, []); // 의존성 배열을 빈 배열로 설정하여 처음 렌더링 시 한 번만 실행

  return (
    <div className="map-container">
      {/* 카카오맵을 표시할 div */}
      <div id="map"></div>
    </div>
  );
};

export default KakaoMap;
