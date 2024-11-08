import React, { useEffect, useState } from 'react';
import './KakaoMap.css';

const KakaoMap = () => {
  const [buses, setBuses] = useState([]); // 버스 데이터를 저장하는 상태
  const [spots, setSpots] = useState([]); // 관광지 데이터를 저장하는 상태
  const [map, setMap] = useState(null); // KakaoMap 객체를 저장하는 상태
  const [markers, setMarkers] = useState([]); // 생성된 마커들을 저장하는 상태
  const [selectedInfo, setSelectedInfo] = useState(null); // 선택된 마커의 정보를 저장하는 상태
  const [activeInfoWindow, setActiveInfoWindow] = useState(null); // 현재 열려있는 인포 윈도우를 저장하는 상태

  // 버스 데이터를 가져오는 함수
  const fetchBusData = async () => {
    try {
      const response = await fetch('http://localhost:8080/bus');
      const data = await response.json();
      setBuses(data); // 응답 데이터를 buses 상태에 저장
      console.log('버스 데이터:', data); // 버스 데이터 다시 불러올 때마다 콘솔에 출력
    } catch (error) {
      console.error('버스 데이터를 가져오는 데 실패했습니다:', error);
    }
  };

  // 관광지 데이터를 가져오는 함수
  const fetchSpotData = async () => {
    try {
      const response = await fetch('http://localhost:8080/spot');
      const data = await response.json();
      setSpots(data.items || []); // 응답 데이터를 spots 상태에 저장
      console.log('관광지 데이터:', data.items || []); // 관광지 데이터는 한 번만 콘솔에 출력
    } catch (error) {
      console.error('관광지 데이터를 가져오는 데 실패했습니다:', error);
    }
  };

  // KakaoMap을 초기화하는 useEffect
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false`;
    script.async = true;

    script.onload = () => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return;

      kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new kakao.maps.LatLng(33.36167, 126.52917), // 지도 중심 좌표
          level: 9, // 지도 확대 레벨
        };
        const createdMap = new kakao.maps.Map(container, options); // KakaoMap 객체 생성
        setMap(createdMap); // 생성된 지도 객체를 map 상태에 저장
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script); // 컴포넌트가 언마운트 될 때 스크립트 제거
    };
  }, []);

  // 지도 위에 마커와 인포 윈도우를 추가하는 useEffect
  useEffect(() => {
    if (!map || (buses.length === 0 && spots.length === 0)) return;

    const { kakao } = window;
    markers.forEach(marker => marker.setMap(null)); // 기존 마커 제거
    const newMarkers = [];

    // 버스 마커와 인포 윈도우 설정
    buses.forEach(bus => {
      const markerPosition = new kakao.maps.LatLng(bus.localY, bus.localX);
      const marker = new kakao.maps.Marker({ position: markerPosition });
      marker.setMap(map);

      const busInfoContent = `
        <div class="custom-infowindow">
          <strong>${bus.plateNo}</strong><br />
          <em>${bus.currStationNm}</em>
        </div>
      `;
      const infowindow = new kakao.maps.InfoWindow({
        content: busInfoContent,
        removable: true,
        zIndex: 3,
      });

      // 마커 클릭 시 기존 인포 윈도우 닫고 새로운 인포 윈도우 열기
      kakao.maps.event.addListener(marker, 'click', () => {
        if (activeInfoWindow) {
          activeInfoWindow.close(); // 현재 열린 인포 윈도우 닫기
        }
        infowindow.open(map, marker);
        setActiveInfoWindow(infowindow); // 새롭게 연 인포 윈도우 저장
        setSelectedInfo({
          type: 'bus',
          data: bus,
        });
      });

      newMarkers.push(marker); // 생성된 마커를 배열에 추가
    });

    // 관광지 마커와 인포 윈도우 설정
    const spotImageSrc = '/location.png';
    const spotImageSize = new kakao.maps.Size(32, 35);
    const spotImageOption = { offset: new kakao.maps.Point(16, 35) };
    const spotMarkerImage = new kakao.maps.MarkerImage(spotImageSrc, spotImageSize, spotImageOption);

    spots.forEach(spot => {
      const markerPosition = new kakao.maps.LatLng(spot.latitude, spot.longitude);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        image: spotMarkerImage,
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

      // 마커 클릭 시 기존 인포 윈도우 닫고 새로운 인포 윈도우 열기
      kakao.maps.event.addListener(marker, 'click', () => {
        if (activeInfoWindow) {
          activeInfoWindow.close(); // 현재 열린 인포 윈도우 닫기
        }
        infowindow.open(map, marker);
        setActiveInfoWindow(infowindow); // 새롭게 연 인포 윈도우 저장
        setSelectedInfo({
          type: 'spot',
          data: spot,
        });
      });

      newMarkers.push(marker); // 생성된 마커를 배열에 추가
    });

    setMarkers(newMarkers); // 마커 배열을 상태에 저장
  }, [buses, spots, map, activeInfoWindow]);

  // 주기적으로 버스 데이터를 가져오는 useEffect
  useEffect(() => {
    fetchBusData(); // 최초 호출
    const interval = setInterval(() => {
      fetchBusData(); // 5초마다 버스 데이터 갱신
    }, 5000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 제거
  }, []);

  // 관광지 데이터를 처음 한 번만 가져오는 useEffect
  useEffect(() => {
    fetchSpotData();
  }, []);

  return (
    <div className="map-container">
      <div id="map"></div> {/* 지도 표시 영역 */}

      {selectedInfo && (
        <div className="info-panel">
          <button
            className="close-button"
            onClick={() => setSelectedInfo(null)} // 정보 패널 닫기 버튼
          >
            닫기
          </button>
          {selectedInfo.type === 'bus' ? (
            <>
              <h3>버스 상세 정보</h3>
              <p><strong>버스 ID:</strong> {selectedInfo.data.id || '정보 없음'}</p>
              <p><strong>노선 번호:</strong> {selectedInfo.data.routeNum || '정보 없음'}</p>
              <p><strong>정류장 이름:</strong> {selectedInfo.data.currStationNm || '정보 없음'}</p>
              <p><strong>버스 번호판:</strong> {selectedInfo.data.plateNo || '정보 없음'}</p>
              <p><strong>위도:</strong> {selectedInfo.data.localY || '정보 없음'}</p>
              <p><strong>경도:</strong> {selectedInfo.data.localX || '정보 없음'}</p>
            </>
          ) : (
            <>
              <h3>관광지 상세 정보</h3>
              <p><strong>관광지 이름:</strong> {selectedInfo.data.title || '정보 없음'}</p>
              <p><strong>주소:</strong> {selectedInfo.data.roadaddress || '주소 없음'}</p>
              <p><strong>설명:</strong> {selectedInfo.data.introduction || '설명 없음'}</p>
              <p><strong>전화번호:</strong> {selectedInfo.data.phoneno || '전화번호 없음'}</p>
              {selectedInfo.data.repPhoto.photoid.imgpath ? (
                <img src={selectedInfo.data.repPhoto.photoid.imgpath} alt="관광지 이미지" />
              ) : (
                <p><strong>이미지:</strong> 이미지 없음</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default KakaoMap;
