import React, { useEffect, useState } from 'react';
import './KakaoMap.css';

// KakaoMap 컴포넌트 정의
const KakaoMap = () => {
  const [buses, setBuses] = useState([]); // 버스 정보를 저장할 상태
  const [spots, setSpots] = useState([]); // 관광지 정보를 저장할 상태
  const [map, setMap] = useState(null); // 카카오 지도를 저장할 상태
  const [markers, setMarkers] = useState([]); // 마커들을 저장할 상태
  const [selectedInfo, setSelectedInfo] = useState(null); // 선택된 상세 정보를 저장할 상태

  // 버스 데이터를 서버에서 가져오는 함수
  const fetchBusData = async () => {
    try {
      const response = await fetch('http://localhost:8080/bus');
      const data = await response.json();
      setBuses(data); // 가져온 버스 데이터를 상태에 저장
    } catch (error) {
      console.error('버스 데이터를 가져오는 데 실패했습니다:', error); // 에러 발생 시 콘솔에 출력
    }
  };

  // 관광지 데이터를 서버에서 가져오는 함수
  const fetchSpotData = async () => {
    try {
      const response = await fetch('http://localhost:8080/spot');
      const data = await response.json();
      setSpots(data.items || []); // 가져온 관광지 데이터를 상태에 저장
    } catch (error) {
      console.error('관광지 데이터를 가져오는 데 실패했습니다:', error); // 에러 발생 시 콘솔에 출력
    }
  };

  // 카카오맵 API를 비동기로 로드하고 지도를 초기화하는 useEffect
  useEffect(() => {
    const script = document.createElement('script'); // 스크립트 태그 생성
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false`; // 카카오 API URL 및 API 키 설정
    script.async = true;

    // 스크립트 로드 완료 후 지도 생성
    script.onload = () => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      // 카카오맵을 불러온 후 지도 생성
      kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new kakao.maps.LatLng(33.36167, 126.52917), // 지도 중심 좌표 설정
          level: 9, // 지도 확대 레벨 설정
        };
        const createdMap = new kakao.maps.Map(container, options); // 지도 생성
        setMap(createdMap); // 생성된 지도를 상태에 저장
      });
    };

    document.head.appendChild(script); // 헤더에 스크립트 추가

    return () => {
      document.head.removeChild(script); // 컴포넌트가 언마운트될 때 스크립트 제거
    };
  }, []);

  // 지도와 버스 및 관광지 데이터에 따라 마커를 추가하는 useEffect
  useEffect(() => {
    if (!map || (buses.length === 0 && spots.length === 0)) return;

    const { kakao } = window;
    markers.forEach(marker => marker.setMap(null)); // 이전 마커들을 지도에서 제거
    const newMarkers = []; // 새 마커 목록 초기화

    // 버스 마커 생성
    buses.forEach(bus => {
      const markerPosition = new kakao.maps.LatLng(bus.localY, bus.localX); // 버스 위치 설정
      const marker = new kakao.maps.Marker({ position: markerPosition }); // 버스 마커 생성
      marker.setMap(map); // 마커를 지도에 추가

      const busInfoContent = `
        <div class="custom-infowindow">
          <strong>${bus.plateNo}</strong><br />
          <em>${bus.currStationNm}</em>
        </div>
      `;
      const infowindow = new kakao.maps.InfoWindow({
        content: busInfoContent, // 정보 창 내용 설정
        removable: true,
        zIndex: 3,
      });

      // 마커 클릭 이벤트 설정
      kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker); // 클릭 시 정보 창 열기
        setSelectedInfo({
          type: 'bus',
          data: bus,
        }); // 선택된 버스 정보를 상태에 저장
      });

      newMarkers.push(marker); // 새 마커 리스트에 추가
    });

    // 관광지 마커 설정
    const spotImageSrc = '/location.png'; // 관광지 마커 이미지 경로
    const spotImageSize = new kakao.maps.Size(32, 35); // 이미지 크기 설정
    const spotImageOption = { offset: new kakao.maps.Point(16, 35) };
    const spotMarkerImage = new kakao.maps.MarkerImage(spotImageSrc, spotImageSize, spotImageOption); // 이미지 옵션 설정

    spots.forEach(spot => {
      const markerPosition = new kakao.maps.LatLng(spot.latitude, spot.longitude);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        image: spotMarkerImage, // 관광지 마커 이미지 설정
      });
      marker.setMap(map);

      const spotInfoContent = `
        <div class="custom-infowindow">
          <strong>${spot.title || '정보 없음'}</strong><br />
          <em>${spot.roadaddress || '주소 없음'}</em><br />
        </div>
      `;
      const infowindow = new kakao.maps.InfoWindow({
        content: spotInfoContent,
        removable: true,
        zIndex: 3,
      });

      // 마커 클릭 이벤트 설정
      kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker); // 클릭 시 정보 창 열기
        setSelectedInfo({
          type: 'spot',
          data: spot,
        }); // 선택된 관광지 정보를 상태에 저장
      });

      newMarkers.push(marker); // 새 마커 리스트에 추가
    });

    setMarkers(newMarkers); // 생성된 마커들을 상태에 저장
  }, [buses, spots, map]);

  // 버스 데이터 주기적으로 갱신하는 useEffect
  useEffect(() => {
    fetchBusData(); // 페이지 로드 시 버스 데이터 가져오기
    const interval = setInterval(() => {
      fetchBusData(); // 5초마다 버스 데이터 갱신
    }, 5000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 제거
  }, []);

  // 페이지 로드 시 관광지 데이터 가져오는 useEffect
  useEffect(() => {
    fetchSpotData(); // 페이지 로드 시 관광지 데이터 가져오기
  }, []);

  // 지도 및 선택된 정보 표시를 위한 렌더링
  return (
    <div className="map-container">
      <div id="map"></div>

      {selectedInfo && ( // 선택된 정보가 있을 때만 상세 정보 표시
        <div className="info-panel">
          {selectedInfo.type === 'bus' ? ( // 선택된 정보가 버스일 때
            <>
              <h3>버스 상세 정보</h3>
              <p><strong>버스 ID:</strong> {selectedInfo.data.id || '정보 없음'}</p>
              <p><strong>노선 번호:</strong> {selectedInfo.data.routeNum || '정보 없음'}</p>
              <p><strong>정류장 이름:</strong> {selectedInfo.data.currStationNm || '정보 없음'}</p>
              <p><strong>버스 번호판:</strong> {selectedInfo.data.plateNo || '정보 없음'}</p>
              <p><strong>위도:</strong> {selectedInfo.data.localY || '정보 없음'}</p>
              <p><strong>경도:</strong> {selectedInfo.data.localX || '정보 없음'}</p>
            </>
          ) : ( // 선택된 정보가 관광지일 때
            <>
              <h3>관광지 상세 정보</h3>
              <p><strong>관광지 이름:</strong> {selectedInfo.data.title || '정보 없음'}</p>
              <p><strong>주소:</strong> {selectedInfo.data.roadaddress || '주소 없음'}</p>
              <p><strong>설명:</strong> {selectedInfo.data.introduction || '설명 없음'}</p>
              <p><strong>전화번호:</strong> {selectedInfo.data.phonenumber || '전화번호 없음'}</p>
              {selectedInfo.data.img ? (
                <img src={selectedInfo.data.img} alt="관광지 이미지" />
              ) : (
                <p>이미지 없음</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default KakaoMap;
