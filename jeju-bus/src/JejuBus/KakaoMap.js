import React, { useEffect, useState } from 'react';
import './KakaoMap.css';

const KakaoMap = () => {
  // 상태 변수 선언
  const [buses, setBuses] = useState([]); // 버스 데이터를 저장
  const [spots, setSpots] = useState([]); // 관광지 데이터를 저장
  const [map, setMap] = useState(null); // 카카오 맵 객체
  const [markers, setMarkers] = useState([]); // 지도에 표시할 마커들
  const [selectedSpot, setSelectedSpot] = useState(null); // 선택된 관광지 정보

  // 버스 데이터를 서버에서 가져오는 함수
  const fetchBusData = async () => {
    try {
      const response = await fetch('http://localhost:8080/bus'); // 서버에서 버스 데이터 요청
      const data = await response.json(); // JSON 형식으로 응답 받기
      console.log("받은 버스 데이터:", data); // 받은 데이터 출력
      setBuses(data); // 받은 데이터로 상태 업데이트
    } catch (error) {
      console.error('버스 데이터를 가져오는 데 실패했습니다:', error); // 에러 발생 시 출력
    }
  };

  // 관광지 데이터를 서버에서 가져오는 함수
  const fetchSpotData = async () => {
    try {
      const response = await fetch('http://localhost:8080/spot'); // 서버에서 관광지 데이터 요청
      const data = await response.json(); // JSON 형식으로 응답 받기
      console.log("받은 관광지 데이터:", data); // 받은 데이터 출력
      setSpots(data.items || []); // 받은 데이터로 상태 업데이트
    } catch (error) {
      console.error('관광지 데이터를 가져오는 데 실패했습니다:', error); // 에러 발생 시 출력
    }
  };

  // 카카오 맵 API 로드 및 맵 객체 초기화
  useEffect(() => {
    const script = document.createElement('script'); // 카카오 맵 스크립트 태그 생성
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false`; // API 키를 포함한 스크립트 주소
    script.async = true;

    script.onload = () => { // 스크립트 로드 완료 시 실행되는 함수
      const kakao = window.kakao; // 카카오 객체 가져오기

      if (!kakao || !kakao.maps) {
        console.error('카카오맵 API가 로드되지 않았습니다.'); // 카카오 맵 API가 로드되지 않았을 경우 오류 메시지
        return;
      }

      kakao.maps.load(() => {
        const container = document.getElementById('map'); // 지도 컨테이너
        const options = {
          center: new kakao.maps.LatLng(33.36167, 126.52917), // 지도 중심 좌표 설정
          level: 9, // 지도 확대/축소 레벨 설정
        };

        const createdMap = new kakao.maps.Map(container, options); // 지도 객체 생성
        setMap(createdMap); // 상태에 지도 객체 저장
      });
    };

    document.head.appendChild(script); // 스크립트를 HTML 문서의 head에 추가

    return () => {
      document.head.removeChild(script); // 컴포넌트 언마운트 시 스크립트 태그 제거
    };
  }, []);

  // 버스 데이터 및 관광지 데이터 마커 표시
  useEffect(() => {
    if (!map || (buses.length === 0 && spots.length === 0)) return; // 맵이 없거나 데이터가 없을 경우 아무것도 하지 않음

    const { kakao } = window;

    markers.forEach(marker => marker.setMap(null)); // 기존 마커 삭제
    const newMarkers = []; // 새로운 마커 배열

    // 버스 마커 추가
    buses.forEach(bus => {
      const markerPosition = new kakao.maps.LatLng(bus.localY, bus.localX); // 버스 좌표
      const marker = new kakao.maps.Marker({ position: markerPosition }); // 마커 생성
      marker.setMap(map); // 지도에 마커 추가
      newMarkers.push(marker); // 새로운 마커 배열에 추가
    });

    // 관광지 마커 이미지 설정
    const spotImageSrc = '/location.png';
    const spotImageSize = new kakao.maps.Size(32, 35);
    const spotImageOption = { offset: new kakao.maps.Point(16, 35) };
    const spotMarkerImage = new kakao.maps.MarkerImage(spotImageSrc, spotImageSize, spotImageOption);

    // 관광지 마커 추가
    spots.forEach(spot => {
      const markerPosition = new kakao.maps.LatLng(spot.latitude, spot.longitude); // 관광지 좌표
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        image: spotMarkerImage, // 관광지 마커 이미지 설정
      });
      marker.setMap(map); // 지도에 마커 추가

      // 인포윈도우 내용 설정
      const infowindowContent = `
        <div class="custom-infowindow">
          <strong>${spot.title || '정보 없음'}</strong><br />
          <em>${spot.roadaddress || '주소 없음'}</em><br />
        </div>
      `;
      const infowindow = new kakao.maps.InfoWindow({
        content: infowindowContent,
        removable: true, // 인포윈도우 닫기 가능
        zIndex: 3, // 인포윈도우가 항상 마커보다 위에 표시되도록 zIndex 설정
      });

      // 마커 클릭 시 인포윈도우 열기
      kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker); // 인포윈도우 열기
        setSelectedSpot(spot); // 선택된 관광지 정보 상태 업데이트
      });

      newMarkers.push(marker); // 새로운 마커 배열에 추가
    });

    setMarkers(newMarkers); // 새로운 마커 상태 업데이트
  }, [buses, spots, map]);

  // 버스 데이터 주기적으로 가져오기
  useEffect(() => {
    fetchBusData();
    const interval = setInterval(() => {
      fetchBusData(); // 5초마다 버스 데이터 갱신
    }, 5000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 제거
  }, []);

  // 관광지 데이터 가져오기
  useEffect(() => {
    fetchSpotData();
  }, []);

  return (
    <div className="map-container">
      <div id="map"></div> {/* 카카오 맵이 표시될 컨테이너 */}
      
      {selectedSpot && ( // 선택된 관광지가 있을 때만 아래 정보 표시
        <div className="spot-info">
          <h3>{selectedSpot.title}</h3> {/* 관광지 이름 */}
          <p><strong>주소:</strong> {selectedSpot.roadaddress || '주소 없음'}</p> {/* 주소 */}
          <p><strong>설명:</strong> {selectedSpot.introduction || '설명 없음'}</p> {/* 설명 */}
          <p><strong>전화번호:</strong> {selectedSpot.phoneno || '전화번호 없음'}</p> {/* 전화번호 */}
          {selectedSpot.repPhoto?.imgpath ? (
            <img src={selectedSpot.repPhoto.imgpath} alt={selectedSpot.title} style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }} /> // 관광지 이미지
          ) : (
            <p>이미지 없음</p> // 이미지가 없을 경우
          )}
        </div>
      )}
    </div>
  );
};

export default KakaoMap;
