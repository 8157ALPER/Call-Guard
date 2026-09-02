package com.seniorshield.callguardian

import android.telecom.Call
import android.telecom.CallScreeningService

/**
 * Android invokes this service only after the user explicitly assigns
 * Call Guardian as the device call-screening app.
 *
 * The service intentionally passes calls through. It does not record or access
 * cellular call audio. Number reputation and transcript checks continue through
 * the user-consented Call Guardian protection flow.
 */
class CallGuardianCallScreeningService : CallScreeningService() {
    override fun onScreenCall(callDetails: Call.Details) {
        val response = CallResponse.Builder()
            .setDisallowCall(false)
            .setRejectCall(false)
            .setSilenceCall(false)
            .setSkipCallLog(false)
            .setSkipNotification(false)
            .build()

        respondToCall(callDetails, response)
    }
}