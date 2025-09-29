#pragma once
#include "NGIAgoraSyncClient.h"
#include <functional>
namespace agora {
namespace base {

/**
 * sync transport observer
 */
class ISyncTransportObserver {
 public:
  virtual void onConnectResult(bool connected) = 0;
  virtual void onDisconnected() = 0;
  virtual void onError(int err) = 0;
  virtual void onDataReceived(const char* data, size_t length) = 0;
  virtual void OnTicketRefreshed(const char* key, const char* ticket) = 0;
  virtual ~ISyncTransportObserver() {}
};

/* sync transport interface */
class ISyncTransport {
 public:
  virtual void connect(const char* token, const char* channelName, rtc::uid_t uid) = 0;
  virtual void disconnect() = 0;
  virtual void sendBuffer(const char* data, size_t length) = 0;
  virtual void registerObserver(ISyncTransportObserver* observer) = 0;
  virtual void renewToken(const char* token) {}
  virtual ~ISyncTransport() {}
};
typedef std::function<void(SyncClientError, const char*, size_t, bool)> QueryCallbackFunc;
typedef std::function<void(SyncClientError, const char*)> DataBaseOpCallbackFunc;
typedef std::function<void(SyncClientError, const char*, const char*)> CollectionOpCallbackFunc;
class ISyncClientEx: public ISyncClient {
    protected:
  virtual ~ISyncClientEx() {}
public:

  virtual int32_t registerExternalTransportLLApiInternal(ISyncTransport* transport) = 0;
  virtual int32_t unregisterExternalTransportLLApiInternal(ISyncTransport* transport) = 0;
  virtual int32_t registerSyncClientObserverLLApiInternal(ISyncClientObserver* observer, void(*safeDeleter)(ISyncClientObserver*) = nullptr) = 0;
  virtual int32_t unregisterSyncClientObserverLLApiInternal(ISyncClientObserver* observer) = 0;
  // client operations
  virtual int32_t setRequestTimeoutLLApiInternal(const uint32_t timeout) = 0;
  virtual int32_t setTicketLLApiInternal(const char* key, const char* ticket) = 0;
  virtual int32_t removeTicketLLApiInternal(const char* key) = 0;
  virtual int32_t renewTicketLLApiInternal(const char* key, const char* ticket) = 0;
  virtual int32_t loginLLApiInternal(const char*token, const char* channelName, user_id_t userId, std::function<void(SyncClientError)> callback) = 0;
  virtual int32_t queryDocLLApiInternal(const char* database, const char* coll, const char* range_start, const char* range_end, int64_t limits, bool doc_only, bool count_only, QueryCallbackFunc callback) = 0;
  virtual int32_t logoutLLApiInternal() = 0;
  virtual int32_t renewTokenLLApiInternal(const char* token) = 0;

  // database operations
  virtual int32_t connectDatabaseLLApiInternal(const char* database, DataBaseOpCallbackFunc callback) = 0;
  virtual int32_t disconnectDatabaseLLApiInternal(const char* database,
                          DataBaseOpCallbackFunc callback) = 0;
  virtual int32_t createCollectionLLApiInternal(const char* database, const char* collection,
                        const char** readable, int readSize,
                        CollectionOpCallbackFunc callback) = 0;
  virtual int32_t deleteCollectionLLApiInternal(const char* database, const char* collection,
                        CollectionOpCallbackFunc callback) = 0;

  // collection operations
  virtual int32_t subscribeLLApiInternal(const char* database, const char* collection,
                    util::AString& snapshotJson) = 0;
  virtual int32_t unsubscribeLLApiInternal(const char* database, const char* collection) = 0;
  virtual int32_t putDocLLApiInternal(const char* database, const char* collection,
                 const char* docName) = 0;
  virtual int32_t deleteDocLLApiInternal(const char* database, const char* collection,
                    const char* docName) = 0;
  virtual int32_t getDocsLLApiInternal(const char* database, const char* collection,
                  util::AString* docNames, uint32_t docSize) = 0;

  // document operations
  virtual int32_t putDocValueLLApiInternal(const char* database, const char* collection,
                      const char* docName, const char* jsonValue) = 0;
  virtual int32_t updateDocValueLLApiInternal(const char* database, const char* collection,
                         const char* docName, const char* path,
                         const char* jsonValue) = 0;
  virtual int32_t deleteDocValueLLApiInternal(const char* database, const char* collection,
                         const char* docName, const char* path) = 0;
  virtual int32_t deleteDocValuesLLApiInternal(const char* database, const char* collection,
                                       const char* docName, const char** path,
                                       uint32_t pathSize) = 0;
  virtual int32_t getDocValueLLApiInternal(const char* database, const char* collection,
                      const char* docName, util::AString& jsonValue) = 0;
  virtual int32_t hasPathLLApiInternal(const char* database, const char* collection,
                  const char* docName, const char* path, bool& result) = 0;
  virtual int32_t keepAliveDocLLApiInternal(const char* database, const char* collection,
                       const char* docName, uint32_t ttl) = 0;

  // sync operations
  virtual int32_t shakehandLLApiInternal() = 0;
};

}
}
