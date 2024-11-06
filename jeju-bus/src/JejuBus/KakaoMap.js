import React, { useEffect } from 'react';
import './KakaoMap.css'; // CSS 파일 import

const KakaoMap = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&autoload=false`;
        script.async = true;

        // 스크립트가 로드된 후 호출할 함수
        script.onload = () => {
            const { kakao } = window;

            // kakao 객체가 정상적으로 로드되었는지 확인
            if (!kakao || !kakao.maps) {
                console.error('카카오맵 API가 제대로 로드되지 않았습니다.');
                return;
            }

            // kakao.maps.load 함수를 사용하여 지도를 초기화
            kakao.maps.load(() => {
                const container = document.getElementById('map');
                const options = {
                    center: new kakao.maps.LatLng(33.450701, 126.570667),
                    level: 3,
                };

                // 지도 객체 생성
                const map = new kakao.maps.Map(container, options);

                // 마커를 표시할 위치
                const markerPosition = new kakao.maps.LatLng(33.450701, 126.570667);

                // 마커 객체 생성
                const marker = new kakao.maps.Marker({
                    position: markerPosition,
                });

                // 지도에 마커를 표시
                marker.setMap(map);
            });
        };

        document.head.appendChild(script);

        // 클린업: 컴포넌트 언마운트 시 스크립트 제거
        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <div className="map-container">
            <div id="map"></div>
        </div>
    );
};

export default KakaoMap;
